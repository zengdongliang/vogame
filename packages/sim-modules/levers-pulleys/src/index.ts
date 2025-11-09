/**
 * 杠杆与滑轮构建器游戏主模块
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

// 砝码类
export class Weight {
  id: string;
  x: number;
  y: number;
  mass: number; // 质量 (kg)
  isDragging: boolean = false;
  
  constructor(id: string, x: number, y: number, mass: number) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.mass = mass;
  }
  
  render(ctx: CanvasRenderingContext2D) {
    // 绘制砝码
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(this.x - 15, this.y - 10, 30, 20);
    
    // 绘制质量标签
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${this.mass}kg`, this.x, this.y);
    
    // 边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x - 15, this.y - 10, 30, 20);
  }
  
  containsPoint(x: number, y: number): boolean {
    return x >= this.x - 15 && x <= this.x + 15 && 
           y >= this.y - 10 && y <= this.y + 10;
  }
}

// 支点类
export class Fulcrum {
  x: number;
  y: number;
  isDragging: boolean = false;
  
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  
  render(ctx: CanvasRenderingContext2D) {
    // 绘制支点三角形
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - 20, this.y + 30);
    ctx.lineTo(this.x + 20, this.y + 30);
    ctx.closePath();
    
    ctx.fillStyle = '#708090';
    ctx.fill();
    
    // 边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  containsPoint(x: number, y: number): boolean {
    // 简单的三角形点击检测
    return x >= this.x - 20 && x <= this.x + 20 && 
           y >= this.y && y <= this.y + 30;
  }
}

// 杠杆类
export class Lever {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  fulcrum: Fulcrum; // 支点
  weights: Weight[] = []; // 砝码
  angle: number = 0; // 杠杆角度
  isBalanced: boolean = false; // 是否平衡
  
  constructor(startX: number, startY: number, endX: number, endY: number, fulcrum: Fulcrum) {
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.fulcrum = fulcrum;
  }
  
  render(ctx: CanvasRenderingContext2D) {
    // 绘制杠杆
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(this.endX, this.endY);
    ctx.strokeStyle = '#4a6cf5';
    ctx.lineWidth = 8;
    ctx.stroke();
    
    // 绘制支点
    this.fulcrum.render(ctx);
    
    // 绘制砝码
    for (const weight of this.weights) {
      weight.render(ctx);
    }
    
    // 如果平衡，显示提示
    if (this.isBalanced) {
      ctx.fillStyle = '#10b981';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('✓ 平衡', this.fulcrum.x, this.fulcrum.y - 40);
    }
  }
  
  // 计算力矩平衡
  calculateTorque(): { leftTorque: number, rightTorque: number, isBalanced: boolean } {
    let leftTorque = 0;
    let rightTorque = 0;
    
    // 计算每个砝码的力矩
    for (const weight of this.weights) {
      // 计算砝码到支点的距离和方向
      const distanceX = weight.x - this.fulcrum.x;
      const torque = weight.mass * 9.8 * distanceX; // 力矩 = 力 × 力臂
      
      if (distanceX < 0) {
        // 左侧力矩
        leftTorque += Math.abs(torque);
      } else {
        // 右侧力矩
        rightTorque += Math.abs(torque);
      }
    }
    
    // 判断是否平衡（误差5%以内）
    const balanceError = Math.abs(leftTorque - rightTorque) / ((leftTorque + rightTorque) / 2);
    const isBalanced = balanceError <= 0.05;
    
    this.isBalanced = isBalanced;
    
    return {
      leftTorque,
      rightTorque,
      isBalanced
    };
  }
}

// 滑轮类型
type PulleyType = 'fixed' | 'movable';

// 滑轮类
export class Pulley {
  id: string;
  x: number;
  y: number;
  type: PulleyType; // 定滑轮或动滑轮
  isDragging: boolean = false;
  
  constructor(id: string, x: number, y: number, type: PulleyType) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.type = type;
  }
  
  render(ctx: CanvasRenderingContext2D) {
    // 绘制滑轮圆
    ctx.beginPath();
    ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = this.type === 'fixed' ? '#3b82f6' : '#ef4444';
    ctx.fill();
    
    // 绘制滑轮边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 绘制滑轮中心
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    
    // 类型标签
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.type === 'fixed' ? '定' : '动', this.x, this.y + 35);
  }
  
  containsPoint(x: number, y: number): boolean {
    const distance = Math.sqrt(Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2));
    return distance <= 20;
  }
}

// 绳子类
export class Rope {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  tension: number = 0; // 绳子张力
  
  constructor(startX: number, startY: number, endX: number, endY: number) {
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
  }
  
  render(ctx: CanvasRenderingContext2D) {
    // 绘制绳子
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(this.endX, this.endY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 绘制张力标签
    if (this.tension > 0) {
      const midX = (this.startX + this.endX) / 2;
      const midY = (this.startY + this.endY) / 2;
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.tension.toFixed(1)}N`, midX, midY - 10);
    }
  }
}

// 杠杆与滑轮构建器游戏主类
export class LeversPulleysBuilder implements SimController {
  private container: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private simulationTime: number = 0;
  
  // 游戏状态
  private lever: Lever | null = null;
  private pulleys: Pulley[] = [];
  private ropes: Rope[] = [];
  private weights: Weight[] = [];
  private currentLevel: number = 1;
  private metrics: Record<string, number | string | boolean> = {};
  private selectedElement: Weight | Fulcrum | Pulley | null = null;
  
  // 交互状态
  private isDragging: boolean = false;
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
    
    // 检查是否点击了砝码
    for (let i = this.weights.length - 1; i >= 0; i--) {
      const weight = this.weights[i];
      if (weight.containsPoint(x, y)) {
        this.selectedElement = weight;
        weight.isDragging = true;
        this.dragStartX = x - weight.x;
        this.dragStartY = y - weight.y;
        return;
      }
    }
    
    // 检查是否点击了支点
    if (this.lever && this.lever.fulcrum.containsPoint(x, y)) {
      this.selectedElement = this.lever.fulcrum;
      this.lever.fulcrum.isDragging = true;
      this.dragStartX = x - this.lever.fulcrum.x;
      this.dragStartY = y - this.lever.fulcrum.y;
      return;
    }
    
    // 检查是否点击了滑轮
    for (let i = this.pulleys.length - 1; i >= 0; i--) {
      const pulley = this.pulleys[i];
      if (pulley.containsPoint(x, y)) {
        this.selectedElement = pulley;
        pulley.isDragging = true;
        this.dragStartX = x - pulley.x;
        this.dragStartY = y - pulley.y;
        return;
      }
    }
  }
  
  private handleMouseMove(e: MouseEvent) {
    if (this.selectedElement) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (this.selectedElement instanceof Weight) {
        this.selectedElement.x = x - this.dragStartX;
        this.selectedElement.y = y - this.dragStartY;
      } else if (this.selectedElement instanceof Fulcrum) {
        this.selectedElement.x = x - this.dragStartX;
        this.selectedElement.y = y - this.dragStartY;
        
        // 更新杠杆位置
        if (this.lever) {
          const leverLength = Math.sqrt(
            Math.pow(this.lever.endX - this.lever.startX, 2) + 
            Math.pow(this.lever.endY - this.lever.startY, 2)
          );
          
          // 保持杠杆长度不变，重新计算端点位置
          const angle = Math.atan2(
            this.lever.endY - this.lever.startY,
            this.lever.endX - this.lever.startX
          );
          
          this.lever.startX = this.selectedElement.x - (leverLength / 2) * Math.cos(angle);
          this.lever.startY = this.selectedElement.y - (leverLength / 2) * Math.sin(angle);
          this.lever.endX = this.selectedElement.x + (leverLength / 2) * Math.cos(angle);
          this.lever.endY = this.selectedElement.y + (leverLength / 2) * Math.sin(angle);
        }
      } else if (this.selectedElement instanceof Pulley) {
        this.selectedElement.x = x - this.dragStartX;
        this.selectedElement.y = y - this.dragStartY;
      }
    }
  }
  
  private handleMouseUp(e: MouseEvent) {
    if (this.selectedElement) {
      if (this.selectedElement instanceof Weight) {
        this.selectedElement.isDragging = false;
      } else if (this.selectedElement instanceof Fulcrum) {
        this.selectedElement.isDragging = false;
      } else if (this.selectedElement instanceof Pulley) {
        this.selectedElement.isDragging = false;
      }
      this.selectedElement = null;
    }
  }
  
  private handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length > 0) {
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // 检查是否点击了砝码
      for (let i = this.weights.length - 1; i >= 0; i--) {
        const weight = this.weights[i];
        if (weight.containsPoint(x, y)) {
          this.selectedElement = weight;
          weight.isDragging = true;
          this.dragStartX = x - weight.x;
          this.dragStartY = y - weight.y;
          return;
        }
      }
      
      // 检查是否点击了支点
      if (this.lever && this.lever.fulcrum.containsPoint(x, y)) {
        this.selectedElement = this.lever.fulcrum;
        this.lever.fulcrum.isDragging = true;
        this.dragStartX = x - this.lever.fulcrum.x;
        this.dragStartY = y - this.lever.fulcrum.y;
        return;
      }
      
      // 检查是否点击了滑轮
      for (let i = this.pulleys.length - 1; i >= 0; i--) {
        const pulley = this.pulleys[i];
        if (pulley.containsPoint(x, y)) {
          this.selectedElement = pulley;
          pulley.isDragging = true;
          this.dragStartX = x - pulley.x;
          this.dragStartY = y - pulley.y;
          return;
        }
      }
    }
  }
  
  private handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    if (this.selectedElement && e.touches.length > 0) {
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      if (this.selectedElement instanceof Weight) {
        this.selectedElement.x = x - this.dragStartX;
        this.selectedElement.y = y - this.dragStartY;
      } else if (this.selectedElement instanceof Fulcrum) {
        this.selectedElement.x = x - this.dragStartX;
        this.selectedElement.y = y - this.dragStartY;
        
        // 更新杠杆位置
        if (this.lever) {
          const leverLength = Math.sqrt(
            Math.pow(this.lever.endX - this.lever.startX, 2) + 
            Math.pow(this.lever.endY - this.lever.startY, 2)
          );
          
          // 保持杠杆长度不变，重新计算端点位置
          const angle = Math.atan2(
            this.lever.endY - this.lever.startY,
            this.lever.endX - this.lever.startX
          );
          
          this.lever.startX = this.selectedElement.x - (leverLength / 2) * Math.cos(angle);
          this.lever.startY = this.selectedElement.y - (leverLength / 2) * Math.sin(angle);
          this.lever.endX = this.selectedElement.x + (leverLength / 2) * Math.cos(angle);
          this.lever.endY = this.selectedElement.y + (leverLength / 2) * Math.sin(angle);
        }
      } else if (this.selectedElement instanceof Pulley) {
        this.selectedElement.x = x - this.dragStartX;
        this.selectedElement.y = y - this.dragStartY;
      }
    }
  }
  
  private handleTouchEnd(e: TouchEvent) {
    e.preventDefault();
    if (this.selectedElement) {
      if (this.selectedElement instanceof Weight) {
        this.selectedElement.isDragging = false;
      } else if (this.selectedElement instanceof Fulcrum) {
        this.selectedElement.isDragging = false;
      } else if (this.selectedElement instanceof Pulley) {
        this.selectedElement.isDragging = false;
      }
      this.selectedElement = null;
    }
  }
  
  private initSimulation() {
    // 初始化杠杆
    const fulcrum = new Fulcrum(this.canvas.width / 2, this.canvas.height / 2 + 50);
    this.lever = new Lever(
      this.canvas.width / 2 - 150,
      this.canvas.height / 2 + 50,
      this.canvas.width / 2 + 150,
      this.canvas.height / 2 + 50,
      fulcrum
    );
    
    // 初始化一些默认砝码
    this.weights = [
      new Weight('weight1', this.canvas.width / 2 - 100, this.canvas.height / 2 + 30, 2),
      new Weight('weight2', this.canvas.width / 2 + 100, this.canvas.height / 2 + 30, 1)
    ];
    
    this.lever.weights = this.weights;
    
    // 初始化指标
    this.metrics = {
      torque_balance_error_pct: 0,
      min_pull_force_N: 0,
      rope_length_used_m: 0
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
    this.initSimulation();
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
  }
  
  getState(): unknown {
    return {
      lever: this.lever ? {
        startX: this.lever.startX,
        startY: this.lever.startY,
        endX: this.lever.endX,
        endY: this.lever.endY,
        fulcrum: {
          x: this.lever.fulcrum.x,
          y: this.lever.fulcrum.y
        },
        weights: this.lever.weights.map(w => ({
          id: w.id,
          x: w.x,
          y: w.y,
          mass: w.mass
        }))
      } : null,
      pulleys: this.pulleys.map(p => ({
        id: p.id,
        x: p.x,
        y: p.y,
        type: p.type
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
        // L1: 平衡不规则杆（平衡误差≤5%）
        const fulcrum1 = new Fulcrum(this.canvas.width / 2, this.canvas.height / 2 + 50);
        this.lever = new Lever(
          this.canvas.width / 2 - 150,
          this.canvas.height / 2 + 50,
          this.canvas.width / 2 + 150,
          this.canvas.height / 2 + 50,
          fulcrum1
        );
        
        // 添加不平衡的砝码
        this.weights = [
          new Weight('weight1', this.canvas.width / 2 - 120, this.canvas.height / 2 + 30, 3),
          new Weight('weight2', this.canvas.width / 2 + 80, this.canvas.height / 2 + 30, 1)
        ];
        
        this.lever.weights = this.weights;
        this.pulleys = [];
        this.ropes = [];
        break;
      case 2:
        // L2: 2×与4×滑轮组挑战（达成指定载荷）
        this.lever = null;
        this.weights = [];
        
        // 创建滑轮组
        this.pulleys = [
          new Pulley('fixed1', this.canvas.width / 2 - 100, this.canvas.height / 2 - 100, 'fixed'),
          new Pulley('movable1', this.canvas.width / 2, this.canvas.height / 2, 'movable'),
          new Pulley('fixed2', this.canvas.width / 2 + 100, this.canvas.height / 2 - 100, 'fixed')
        ];
        
        // 创建绳子连接
        this.ropes = [
          new Rope(
            this.canvas.width / 2 - 100, 
            this.canvas.height / 2 - 100,
            this.canvas.width / 2, 
            this.canvas.height / 2
          ),
          new Rope(
            this.canvas.width / 2, 
            this.canvas.height / 2,
            this.canvas.width / 2 + 100, 
            this.canvas.height / 2 - 100
          )
        ];
        break;
      case 3:
        // L3: 在限制长度内以最小拉力起重
        const fulcrum3 = new Fulcrum(this.canvas.width / 2, this.canvas.height / 2 + 50);
        this.lever = new Lever(
          this.canvas.width / 2 - 100,
          this.canvas.height / 2 + 50,
          this.canvas.width / 2 + 100,
          this.canvas.height / 2 + 50,
          fulcrum3
        );
        
        // 添加重物
        this.weights = [
          new Weight('heavy', this.canvas.width / 2 + 80, this.canvas.height / 2 + 30, 5)
        ];
        
        this.lever.weights = this.weights;
        this.pulleys = [];
        this.ropes = [];
        break;
      default:
        this.initSimulation();
    }
  }
  
  private updatePhysics(dt: number) {
    // 时间步长（秒）
    const dtSec = dt / 1000;
    this.simulationTime += dt;
    
    // 如果有杠杆，计算力矩平衡
    if (this.lever) {
      const torqueResult = this.lever.calculateTorque();
      
      // 更新指标
      const balanceError = Math.abs(torqueResult.leftTorque - torqueResult.rightTorque) / 
                           ((torqueResult.leftTorque + torqueResult.rightTorque) / 2);
      this.metrics.torque_balance_error_pct = balanceError * 100;
    }
    
    // 如果有滑轮组，计算绳子张力
    if (this.pulleys.length > 0 && this.weights.length > 0) {
      // 简化计算：张力 = 总重量 / 滑轮数量
      let totalWeight = 0;
      for (const weight of this.weights) {
        totalWeight += weight.mass * 9.8;
      }
      
      const tension = totalWeight / this.pulleys.length;
      for (const rope of this.ropes) {
        rope.tension = tension;
      }
      
      this.metrics.min_pull_force_N = tension;
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
    
    // 绘制杠杆（如果存在）
    if (this.lever) {
      this.lever.render(ctx);
      
      // 绘制力矩条
      this.drawTorqueBars();
    }
    
    // 绘制滑轮（如果存在）
    for (const pulley of this.pulleys) {
      pulley.render(ctx);
    }
    
    // 绘制绳子（如果存在）
    for (const rope of this.ropes) {
      rope.render(ctx);
    }
    
    // 绘制砝码（如果存在）
    for (const weight of this.weights) {
      weight.render(ctx);
    }
    
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
  
  private drawTorqueBars() {
    if (!this.lever) return;
    
    const ctx = this.ctx;
    const torqueResult = this.lever.calculateTorque();
    
    // 绘制力矩条背景
    const barX = 50;
    const barY = 50;
    const barWidth = 200;
    const barHeight = 20;
    
    // 左侧力矩条
    ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // 左侧力矩填充
    const leftFillWidth = Math.min(barWidth, (torqueResult.leftTorque / 50) * barWidth);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(barX, barY, leftFillWidth, barHeight);
    
    // 右侧力矩条
    ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.fillRect(barX, barY + 30, barWidth, barHeight);
    
    // 右侧力矩填充
    const rightFillWidth = Math.min(barWidth, (torqueResult.rightTorque / 50) * barWidth);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(barX, barY + 30, rightFillWidth, barHeight);
    
    // 力矩标签
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`左侧力矩: ${torqueResult.leftTorque.toFixed(1)} N⋅m`, barX, barY - 5);
    ctx.fillText(`右侧力矩: ${torqueResult.rightTorque.toFixed(1)} N⋅m`, barX, barY + 25);
    
    // 平衡状态
    ctx.fillStyle = torqueResult.isBalanced ? '#10b981' : '#ef4444';
    ctx.font = '16px Arial';
    ctx.fillText(
      torqueResult.isBalanced ? '✓ 平衡' : '✗ 未平衡', 
      barX, 
      barY + 70
    );
  }
  
  private drawControlPanel() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 控制面板背景
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(10, height - 180, 350, 170);
    ctx.strokeStyle = 'rgba(74, 108, 245, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, height - 180, 350, 170);
    
    // 标题
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Orbitron, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('杠杆与滑轮控制台', 20, height - 160);
    
    // 当前关卡
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(`当前关卡: ${this.currentLevel}`, 20, height - 140);
    
    // 关卡描述
    let levelDesc = '';
    switch (this.currentLevel) {
      case 1:
        levelDesc = 'L1: 平衡不规则杆';
        break;
      case 2:
        levelDesc = 'L2: 滑轮组挑战';
        break;
      case 3:
        levelDesc = 'L3: 最小拉力起重';
        break;
      default:
        levelDesc = `L${this.currentLevel}: 自定义`;
    }
    
    ctx.fillText(levelDesc, 20, height - 120);
    
    // 指标显示
    ctx.fillText(`力矩误差: ${this.metrics.torque_balance_error_pct?.toFixed(1)}%`, 20, height - 100);
    ctx.fillText(`最小拉力: ${this.metrics.min_pull_force_N?.toFixed(1)}N`, 20, height - 80);
    ctx.fillText(`绳长使用: ${this.metrics.rope_length_used_m?.toFixed(1)}m`, 20, height - 60);
  }
}

// 初始化函数
export async function init(options: SimInitOptions): Promise<SimController> {
  const leversPulleysBuilder = new LeversPulleysBuilder(options);
  return leversPulleysBuilder;
}