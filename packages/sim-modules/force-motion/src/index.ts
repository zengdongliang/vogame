/**
 * 力与运动游乐场游戏主模块
 * 根据 docs/spec/tech-stack.md 中的模块API标准实现
 */

// 模块接口定义
export interface SimInitOptions {
  container: HTMLElement; // 游戏容器
  locale?: string;
  devicePerf?: 'low'|'mid'|'high';
  gradeBand?: string; // 年级段
}

export interface SimController {
  start(): void;
  pause(): void;
  reset(): void;
  destroy(): void;
  step(dtMs: number): void; // 若外部驱动
  setParams(p: Record<string, unknown>): void;
  getState(): unknown;
  setState(s: unknown): void;
  getMetrics(): Record<string, number | string | boolean>;
}

// 力矢量类
export class ForceVector {
  id: string;
  x: number;
  y: number;
  magnitude: number; // 力的大小 (牛顿)
  angle: number; // 力的角度 (弧度)
  isDragging: boolean = false;
  
  constructor(id: string, x: number, y: number, magnitude: number, angle: number) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.magnitude = magnitude;
    this.angle = angle;
  }
  
  render(ctx: CanvasRenderingContext2D, originX: number, originY: number) {
    // 计算力矢量的终点
    const endX = originX + this.magnitude * Math.cos(this.angle) * 5; // 缩放显示
    const endY = originY + this.magnitude * Math.sin(this.angle) * 5;
    
    // 绘制力矢量线
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 绘制箭头
    const arrowSize = 10;
    const angle = Math.atan2(endY - originY, endX - originX);
    
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowSize * Math.cos(angle - Math.PI/6),
      endY - arrowSize * Math.sin(angle - Math.PI/6)
    );
    ctx.lineTo(
      endX - arrowSize * Math.cos(angle + Math.PI/6),
      endY - arrowSize * Math.sin(angle + Math.PI/6)
    );
    ctx.closePath();
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    
    // 绘制力值标签
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.magnitude.toFixed(1)}N`, (originX + endX) / 2, (originY + endY) / 2 - 10);
  }
}

// 物体类
export class PhysicsObject {
  x: number;
  y: number;
  width: number;
  height: number;
  mass: number; // 质量 (kg)
  velocityX: number = 0; // 速度 (m/s)
  velocityY: number = 0;
  accelerationX: number = 0; // 加速度 (m/s²)
  accelerationY: number = 0;
  friction: number; // 摩擦系数
  isDragging: boolean = false;
  isSelected: boolean = false;
  
  constructor(x: number, y: number, mass: number = 1, friction: number = 0.1) {
    this.x = x;
    this.y = y;
    this.width = 60;
    this.height = 40;
    this.mass = mass;
    this.friction = friction;
  }
  
  render(ctx: CanvasRenderingContext2D) {
    // 绘制物体
    ctx.fillStyle = this.isSelected ? '#6c63ff' : '#4a6cf5';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // 绘制质量标签
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${this.mass}kg`, this.x + this.width/2, this.y + this.height/2);
    
    // 边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  }
  
  containsPoint(x: number, y: number): boolean {
    return x >= this.x && x <= this.x + this.width && 
           y >= this.y && y <= this.y + this.height;
  }
}

// 图表类型
type ChartType = 'acceleration' | 'velocity' | 'position';

// 力与运动游乐场游戏主类
export class ForceMotionPlayground implements SimController {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private simulationTime: number = 0;
  
  // 游戏状态
  private physicsObject: PhysicsObject;
  private forces: ForceVector[] = [];
  private currentLevel: number = 1;
  private metrics: Record<string, number | string | boolean> = {};
  private chartType: ChartType = 'acceleration';
  
  // 图表数据
  private timeData: number[] = [];
  private accelerationData: number[] = [];
  private velocityData: number[] = [];
  private positionData: number[] = [];
  
  // 交互状态
  private selectedElement: PhysicsObject | ForceVector | null = null;
  private isDraggingForce: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  
  constructor(private options: SimInitOptions) {
    this.container = options.container;
    this.initCanvas();
    this.initSimulation();
    this.setupEventListeners();
  }
  
  private initCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
    this.ctx = this.canvas.getContext('2d')!;
    this.container.appendChild(this.canvas);
    
    // 添加样式
    this.canvas.style.borderRadius = '8px';
    this.canvas.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
  }
  
  private setupEventListeners() {
    // 鼠标事件
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    
    // 触摸事件（移动端支持）
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }
  
  private handleMouseDown(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 检查是否点击了物体
    if (this.physicsObject.containsPoint(x, y)) {
      this.selectedElement = this.physicsObject;
      this.physicsObject.isDragging = true;
      this.dragStartX = x - this.physicsObject.x;
      this.dragStartY = y - this.physicsObject.y;
      return;
    }
    
    // 检查是否点击了力矢量
    for (let i = this.forces.length - 1; i >= 0; i--) {
      const force = this.forces[i];
      // 简单的点击检测 - 检查是否在力线附近
      const startX = this.physicsObject.x + this.physicsObject.width/2;
      const startY = this.physicsObject.y + this.physicsObject.height/2;
      const endX = startX + force.magnitude * Math.cos(force.angle) * 5;
      const endY = startY + force.magnitude * Math.sin(force.angle) * 5;
      
      // 计算点到线段的距离
      const distance = this.pointToLineDistance(x, y, startX, startY, endX, endY);
      if (distance < 10) { // 10像素容差
        this.selectedElement = force;
        this.isDraggingForce = true;
        return;
      }
    }
  }
  
  private pointToLineDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    // 计算点到线段的最短距离
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
      param = dot / lenSq;
    }
    
    let xx, yy;
    
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  private handleMouseMove(e: MouseEvent) {
    if (this.physicsObject.isDragging && this.selectedElement === this.physicsObject) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      this.physicsObject.x = x - this.dragStartX;
      this.physicsObject.y = y - this.dragStartY;
    }
  }
  
  private handleMouseUp(e: MouseEvent) {
    this.physicsObject.isDragging = false;
    this.isDraggingForce = false;
  }
  
  private handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length > 0) {
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // 检查是否点击了物体
      if (this.physicsObject.containsPoint(x, y)) {
        this.selectedElement = this.physicsObject;
        this.physicsObject.isDragging = true;
        this.dragStartX = x - this.physicsObject.x;
        this.dragStartY = y - this.physicsObject.y;
        return;
      }
      
      // 检查是否点击了力矢量
      for (let i = this.forces.length - 1; i >= 0; i--) {
        const force = this.forces[i];
        // 简单的点击检测 - 检查是否在力线附近
        const startX = this.physicsObject.x + this.physicsObject.width/2;
        const startY = this.physicsObject.y + this.physicsObject.height/2;
        const endX = startX + force.magnitude * Math.cos(force.angle) * 5;
        const endY = startY + force.magnitude * Math.sin(force.angle) * 5;
        
        // 计算点到线段的距离
        const distance = this.pointToLineDistance(x, y, startX, startY, endX, endY);
        if (distance < 10) { // 10像素容差
          this.selectedElement = force;
          this.isDraggingForce = true;
          return;
        }
      }
    }
  }
  
  private handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    if (this.physicsObject.isDragging && this.selectedElement === this.physicsObject && e.touches.length > 0) {
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      this.physicsObject.x = x - this.dragStartX;
      this.physicsObject.y = y - this.dragStartY;
    }
  }
  
  private handleTouchEnd(e: TouchEvent) {
    e.preventDefault();
    this.physicsObject.isDragging = false;
    this.isDraggingForce = false;
  }
  
  private initSimulation() {
    // 初始化物理对象
    this.physicsObject = new PhysicsObject(
      this.canvas.width / 2 - 30, // 初始x位置
      this.canvas.height / 2 - 20, // 初始y位置
      1, // 质量 1kg
      0.1 // 摩擦系数
    );
    
    // 初始化一些默认力
    this.forces = [
      new ForceVector('force1', 0, 0, 2, 0), // 向右2N
      new ForceVector('force2', 0, 0, 1.5, Math.PI) // 向左1.5N
    ];
    
    // 初始化指标
    this.metrics = {
      accel_target_error_pct: 0,
      hold_stability_s: 0,
      path_completion_time_s: 0
    };
  }
  
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.gameLoop();
  }
  
  pause(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  reset(): void {
    this.pause();
    // 重置物理对象状态
    this.physicsObject.x = this.canvas.width / 2 - 30;
    this.physicsObject.y = this.canvas.height / 2 - 20;
    this.physicsObject.velocityX = 0;
    this.physicsObject.velocityY = 0;
    this.physicsObject.accelerationX = 0;
    this.physicsObject.accelerationY = 0;
    
    // 重置数据
    this.timeData = [];
    this.accelerationData = [];
    this.velocityData = [];
    this.positionData = [];
    
    this.simulationTime = 0;
    this.render();
  }
  
  destroy(): void {
    this.pause();
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mouseleave', this.handleMouseUp);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
  
  step(dtMs: number): void {
    // 更新物理模拟
    this.updatePhysics(dtMs);
  }
  
  setParams(p: Record<string, unknown>): void {
    if (p.level !== undefined) {
      this.currentLevel = p.level as number;
      this.setupLevel(this.currentLevel);
    }
    if (p.mass !== undefined) {
      this.physicsObject.mass = p.mass as number;
    }
    if (p.friction !== undefined) {
      this.physicsObject.friction = p.friction as number;
    }
  }
  
  getState(): unknown {
    return {
      object: {
        x: this.physicsObject.x,
        y: this.physicsObject.y,
        mass: this.physicsObject.mass,
        friction: this.physicsObject.friction
      },
      forces: this.forces.map(f => ({
        id: f.id,
        magnitude: f.magnitude,
        angle: f.angle
      })),
      currentLevel: this.currentLevel,
      simulationTime: this.simulationTime
    };
  }
  
  setState(s: unknown): void {
    // 在实际实现中会从状态恢复游戏
  }
  
  getMetrics(): Record<string, number | string | boolean> {
    return this.metrics;
  }
  
  private setupLevel(level: number) {
    switch (level) {
      case 1:
        // L1: 使 a=2 m/s²（误差≤10%）
        this.physicsObject = new PhysicsObject(
          this.canvas.width / 2 - 30,
          this.canvas.height / 2 - 20,
          1, // 质量 1kg
          0.0 // 无摩擦
        );
        this.forces = [new ForceVector('target_force', 0, 0, 2, 0)]; // 2N 向右
        break;
      case 2:
        // L2: 保持物体静止≥5秒（平衡受力）
        this.physicsObject = new PhysicsObject(
          this.canvas.width / 2 - 30,
          this.canvas.height / 2 - 20,
          1, // 质量 1kg
          0.1 // 摩擦
        );
        this.forces = [
          new ForceVector('force1', 0, 0, 1, 0), // 1N 向右
          new ForceVector('force2', 0, 0, 1, Math.PI) // 1N 向左
        ];
        break;
      case 3:
        // L3: 限时到达指定位置（综合）
        this.physicsObject = new PhysicsObject(
          this.canvas.width / 4 - 30,
          this.canvas.height / 2 - 20,
          1, // 质量 1kg
          0.05 // 小摩擦
        );
        this.forces = [new ForceVector('init_force', 0, 0, 1.5, 0)]; // 1.5N 向右
        break;
      default:
        this.initSimulation();
    }
  }
  
  private updatePhysics(dt: number) {
    // 时间步长（秒）
    const dtSec = dt / 1000;
    this.simulationTime += dt;
    
    // 计算合力
    let totalForceX = 0;
    let totalForceY = 0;
    
    // 计算所有力的总和
    for (const force of this.forces) {
      totalForceX += force.magnitude * Math.cos(force.angle);
      totalForceY += force.magnitude * Math.sin(force.angle);
    }
    
    // 计算摩擦力（与运动方向相反）
    const speed = Math.sqrt(this.physicsObject.velocityX ** 2 + this.physicsObject.velocityY ** 2);
    if (speed > 0) {
      const frictionForce = -this.physicsObject.friction * this.physicsObject.mass * 9.8; // F_friction = μ * m * g
      const frictionX = frictionForce * (this.physicsObject.velocityX / speed);
      const frictionY = frictionForce * (this.physicsObject.velocityY / speed);
      
      totalForceX += frictionX;
      totalForceY += frictionY;
    }
    
    // 根据牛顿第二定律 F=ma 计算加速度
    this.physicsObject.accelerationX = totalForceX / this.physicsObject.mass;
    this.physicsObject.accelerationY = totalForceY / this.physicsObject.mass;
    
    // 更新速度 (v = v0 + a * t)
    this.physicsObject.velocityX += this.physicsObject.accelerationX * dtSec;
    this.physicsObject.velocityY += this.physicsObject.accelerationY * dtSec;
    
    // 更新位置 (x = x0 + v * t)
    this.physicsObject.x += this.physicsObject.velocityX * dtSec * 50; // 乘以50是为了在屏幕上看得更清楚
    this.physicsObject.y += this.physicsObject.velocityY * dtSec * 50;
    
    // 边界碰撞（简单处理）
    if (this.physicsObject.x < 0) {
      this.physicsObject.x = 0;
      this.physicsObject.velocityX = -this.physicsObject.velocityX * 0.8; // 弹性碰撞
    } else if (this.physicsObject.x + this.physicsObject.width > this.canvas.width) {
      this.physicsObject.x = this.canvas.width - this.physicsObject.width;
      this.physicsObject.velocityX = -this.physicsObject.velocityX * 0.8;
    }
    
    if (this.physicsObject.y < 0) {
      this.physicsObject.y = 0;
      this.physicsObject.velocityY = -this.physicsObject.velocityY * 0.8;
    } else if (this.physicsObject.y + this.physicsObject.height > this.canvas.height) {
      this.physicsObject.y = this.canvas.height - this.physicsObject.height;
      this.physicsObject.velocityY = -this.physicsObject.velocityY * 0.8;
    }
    
    // 记录数据用于图表
    const currentTime = this.simulationTime / 1000; // 转换为秒
    this.timeData.push(currentTime);
    this.accelerationData.push(Math.sqrt(this.physicsObject.accelerationX ** 2 + this.physicsObject.accelerationY ** 2));
    this.velocityData.push(Math.sqrt(this.physicsObject.velocityX ** 2 + this.physicsObject.velocityY ** 2));
    this.positionData.push(Math.sqrt((this.physicsObject.x - (this.canvas.width / 2 - 30)) ** 2 + (this.physicsObject.y - (this.canvas.height / 2 - 20)) ** 2) / 50); // 相对起始位置的距离
    
    // 限制数据点数量以避免内存问题
    if (this.timeData.length > 1000) {
      this.timeData.shift();
      this.accelerationData.shift();
      this.velocityData.shift();
      this.positionData.shift();
    }
  }
  
  private gameLoop = () => {
    this.updatePhysics(16); // 60 FPS
    this.render();
    
    if (this.isRunning) {
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }
  }
  
  private render() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 绘制背景
    this.drawBackground();
    
    // 绘制网格
    this.drawGrid();
    
    // 绘制力矢量
    for (const force of this.forces) {
      const originX = this.physicsObject.x + this.physicsObject.width / 2;
      const originY = this.physicsObject.y + this.physicsObject.height / 2;
      force.render(ctx, originX, originY);
    }
    
    // 绘制物理对象
    this.physicsObject.render(ctx);
    
    // 绘制图表
    this.drawChart();
    
    // 绘制控制面板
    this.drawControlPanel();
  }
  
  private drawBackground() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0b1120');
    gradient.addColorStop(1, '#1e293b');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  
  private drawGrid() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 绘制网格线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // 垂直线
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // 水平线
    for (let y = 0; y < height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }
  
  private drawChart() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 图表区域
    const chartX = 20;
    const chartY = 20;
    const chartWidth = width - 40;
    const chartHeight = 150;
    
    // 绘制图表背景
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(chartX, chartY, chartWidth, chartHeight);
    ctx.strokeStyle = 'rgba(74, 108, 245, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(chartX, chartY, chartWidth, chartHeight);
    
    // 绘制图表标题
    ctx.fillStyle = 'white';
    ctx.font = '14px Orbitron, monospace';
    ctx.fillText(`图表: ${this.chartType}`, chartX + 10, chartY + 20);
    
    // 如果有数据，绘制曲线
    if (this.timeData.length > 1) {
      // 确定数据范围
      let maxData = 0;
      let dataToDraw: number[] = [];
      
      switch (this.chartType) {
        case 'acceleration':
          dataToDraw = this.accelerationData;
          maxData = Math.max(...this.accelerationData, 1); // 确保不为0
          break;
        case 'velocity':
          dataToDraw = this.velocityData;
          maxData = Math.max(...this.velocityData, 1);
          break;
        case 'position':
          dataToDraw = this.positionData;
          maxData = Math.max(...this.positionData, 1);
          break;
      }
      
      // 绘制曲线
      ctx.beginPath();
      ctx.moveTo(
        chartX + 10,
        chartY + chartHeight - 20 - (dataToDraw[0] / maxData) * (chartHeight - 40)
      );
      
      for (let i = 1; i < dataToDraw.length; i++) {
        const x = chartX + 10 + (i / (dataToDraw.length - 1)) * (chartWidth - 20);
        const y = chartY + chartHeight - 20 - (dataToDraw[i] / maxData) * (chartHeight - 40);
        ctx.lineTo(x, y);
      }
      
      // 设置线条颜色根据图表类型
      switch (this.chartType) {
        case 'acceleration':
          ctx.strokeStyle = '#ef4444'; // 红色 - 加速度
          break;
        case 'velocity':
          ctx.strokeStyle = '#10b981'; // 绿色 - 速度
          break;
        case 'position':
          ctx.strokeStyle = '#3b82f6'; // 蓝色 - 位置
          break;
      }
      
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  
  private drawControlPanel() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    
    // 控制面板背景
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(10, height - 150, 300, 140);
    ctx.strokeStyle = 'rgba(74, 108, 245, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, height - 150, 300, 140);
    
    // 标题
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Orbitron, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('力与运动控制台', 20, height - 130);
    
    // 物理信息
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(`质量: ${this.physicsObject.mass}kg`, 20, height - 110);
    ctx.fillText(`加速度: ${this.physicsObject.accelerationX.toFixed(2)}m/s²`, 20, height - 90);
    ctx.fillText(`速度: ${this.physicsObject.velocityX.toFixed(2)}m/s`, 20, height - 70);
    ctx.fillText(`位置: (${this.physicsObject.x.toFixed(1)}, ${this.physicsObject.y.toFixed(1)})`, 20, height - 50);
    
    // 当前关卡
    ctx.fillText(`当前关卡: ${this.currentLevel}`, 20, height - 30);
  }
}

// 初始化函数
export async function init(options: SimInitOptions): Promise<SimController> {
  const forceMotionPlayground = new ForceMotionPlayground(options);
  return forceMotionPlayground;
}