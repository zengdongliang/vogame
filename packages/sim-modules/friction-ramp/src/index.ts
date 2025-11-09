/**
 * 摩擦与斜面游戏主模块
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

// 材质类型
export type MaterialType = 'wood' | 'rubber' | 'steel' | 'ice' | 'concrete';

// 材质属性
interface MaterialProperties {
  staticFriction: number; // 静摩擦系数
  kineticFriction: number; // 动摩擦系数
  color: string; // 显示颜色
  name: string; // 材质名称
}

// 材质数据库
const MATERIALS: Record<MaterialType, MaterialProperties> = {
  wood: {
    staticFriction: 0.5,
    kineticFriction: 0.4,
    color: '#8B4513',
    name: '木头'
  },
  rubber: {
    staticFriction: 0.8,
    kineticFriction: 0.6,
    color: '#2F4F4F',
    name: '橡胶'
  },
  steel: {
    staticFriction: 0.6,
    kineticFriction: 0.4,
    color: '#708090',
    name: '钢铁'
  },
  ice: {
    staticFriction: 0.1,
    kineticFriction: 0.05,
    color: '#87CEEB',
    name: '冰'
  },
  concrete: {
    staticFriction: 0.7,
    kineticFriction: 0.6,
    color: '#A9A9A9',
    name: '混凝土'
  }
};

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
  material: MaterialType; // 材质
  isOnRamp: boolean = true; // 是否在斜面上
  isSliding: boolean = false; // 是否在滑动
  timeOnRamp: number = 0; // 在斜面上的时间
  staticFriction: number;
  kineticFriction: number;
  
  constructor(x: number, y: number, mass: number, material: MaterialType) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 20;
    this.mass = mass;
    this.material = material;
    const matProps = MATERIALS[material];
    this.staticFriction = matProps.staticFriction;
    this.kineticFriction = matProps.kineticFriction;
  }
  
  render(ctx: CanvasRenderingContext2D) {
    // 绘制物体
    ctx.fillStyle = MATERIALS[this.material].color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // 绘制材质标签
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${MATERIALS[this.material].name}`, this.x + this.width/2, this.y + this.height/2);
    
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

// 摩擦与斜面游戏主类
export class FrictionRamp implements SimController {
  private container: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private simulationTime: number = 0;
  
  // 游戏状态
  private physicsObject: PhysicsObject;
  private rampAngle: number = 0; // 斜面角度 (弧度)
  private rampLength: number = 400; // 斜面长度
  private rampHeight: number = 100; // 斜面高度
  private currentLevel: number = 1;
  private metrics: Record<string, number | string | boolean> = {};
  private timer: number = 0; // 计时器
  
  // 交互状态
  private isDraggingObject: boolean = false;
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
      this.isDraggingObject = true;
      this.dragStartX = x - this.physicsObject.x;
      this.dragStartY = y - this.physicsObject.y;
      return;
    }
  }
  
  private handleMouseMove(e: MouseEvent) {
    if (this.isDraggingObject) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      this.physicsObject.x = x - this.dragStartX;
      this.physicsObject.y = y - this.dragStartY;
    }
  }
  
  private handleMouseUp(e: MouseEvent) {
    this.isDraggingObject = false;
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
        this.isDraggingObject = true;
        this.dragStartX = x - this.physicsObject.x;
        this.dragStartY = y - this.physicsObject.y;
        return;
      }
    }
  }
  
  private handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    if (this.isDraggingObject && e.touches.length > 0) {
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
    this.isDraggingObject = false;
  }
  
  private initSimulation() {
    // 初始化物理对象
    this.physicsObject = new PhysicsObject(
      this.canvas.width / 2 - 200, // 初始x位置（斜面起点）
      this.canvas.height / 2 + 50, // 初始y位置（斜面附近）
      1, // 质量 1kg
      'wood' // 材质为木头
    );
    
    // 初始化指标
    this.metrics = {
      critical_angle_error_pct: 0,
      time_to_bottom_s: 0,
      hold_static_s: 0
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
    this.physicsObject.x = this.canvas.width / 2 - 200;
    this.physicsObject.y = this.canvas.height / 2 + 50;
    this.physicsObject.velocityX = 0;
    this.physicsObject.velocityY = 0;
    this.physicsObject.accelerationX = 0;
    this.physicsObject.accelerationY = 0;
    this.physicsObject.isSliding = false;
    
    this.simulationTime = 0;
    this.timer = 0;
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
    if (p.angle !== undefined) {
      this.rampAngle = (p.angle as number) * Math.PI / 180; // 转换为弧度
    }
    if (p.material !== undefined) {
      this.physicsObject.material = p.material as MaterialType;
      const matProps = MATERIALS[this.physicsObject.material];
      this.physicsObject.staticFriction = matProps.staticFriction;
      this.physicsObject.kineticFriction = matProps.kineticFriction;
    }
    if (p.mass !== undefined) {
      this.physicsObject.mass = p.mass as number;
    }
  }
  
  getState(): unknown {
    return {
      object: {
        x: this.physicsObject.x,
        y: this.physicsObject.y,
        mass: this.physicsObject.mass,
        material: this.physicsObject.material
      },
      rampAngle: this.rampAngle,
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
        // L1: 测木-橡胶临界角（误差≤5%）
        this.physicsObject.material = 'wood';
        const woodProps = MATERIALS['wood'];
        // 临界角 = arctan(静摩擦系数)
        const criticalAngle = Math.atan(woodProps.staticFriction);
        this.rampAngle = criticalAngle * 0.95; // 设置略低于临界角的角度
        break;
      case 2:
        // L2: 最短时间滑到底（竞速）
        this.physicsObject.material = 'ice'; // 选择低摩擦材料
        this.rampAngle = 30 * Math.PI / 180; // 30度
        break;
      case 3:
        // L3: 在限定角度保持静止≥5秒
        this.physicsObject.material = 'rubber'; // 选择高摩擦材料
        this.rampAngle = 10 * Math.PI / 180; // 10度小角度
        break;
      default:
        this.initSimulation();
    }
  }
  
  private updatePhysics(dt: number) {
    // 时间步长（秒）
    const dtSec = dt / 1000;
    this.simulationTime += dt;
    
    // 计算斜面上的受力
    const gravity = 9.8; // m/s²
    const weight = this.physicsObject.mass * gravity;
    
    // 平行于斜面的重力分量
    const parallelForce = weight * Math.sin(this.rampAngle);
    // 垂直于斜面的重力分量（用于计算摩擦力）
    const normalForce = weight * Math.cos(this.rampAngle);
    
    // 计算静摩擦力的最大值
    const maxStaticFriction = this.physicsObject.staticFriction * normalForce;
    
    // 判断物体是否开始滑动
    if (!this.physicsObject.isSliding) {
      // 如果平行力小于最大静摩擦力，物体静止
      if (Math.abs(parallelForce) <= maxStaticFriction) {
        // 物体静止，不施加净力
        this.physicsObject.accelerationX = 0;
        this.physicsObject.accelerationY = 0;
        this.physicsObject.velocityX = 0;
        this.physicsObject.velocityY = 0;
        
        // 如果在L3关卡，计算保持静止的时间
        if (this.currentLevel === 3) {
          this.physicsObject.timeOnRamp += dtSec;
        }
      } else {
        // 物体开始滑动
        this.physicsObject.isSliding = true;
      }
    }
    
    if (this.physicsObject.isSliding) {
      // 计算动摩擦力
      const kineticFriction = this.physicsObject.kineticFriction * normalForce;
      
      // 净力 = 平行力 - 动摩擦力
      let netForce = parallelForce - (parallelForce > 0 ? kineticFriction : -kineticFriction);
      
      // 计算沿斜面方向的加速度
      this.physicsObject.accelerationX = netForce / this.physicsObject.mass * Math.cos(this.rampAngle);
      this.physicsObject.accelerationY = netForce / this.physicsObject.mass * Math.sin(this.rampAngle);
      
      // 更新速度
      this.physicsObject.velocityX += this.physicsObject.accelerationX * dtSec;
      this.physicsObject.velocityY += this.physicsObject.accelerationY * dtSec;
      
      // 更新位置
      this.physicsObject.x += this.physicsObject.velocityX * dtSec * 100; // 缩放因子
      this.physicsObject.y += this.physicsObject.velocityY * dtSec * 100;
      
      // 计时器（用于L2关卡）
      if (this.currentLevel === 2) {
        this.timer += dtSec;
      }
    }
    
    // 检查物体是否滑到底部
    const rampStartX = this.canvas.width / 2 - 200;
    const rampEndX = rampStartX + this.rampLength * Math.cos(this.rampAngle);
    const rampEndY = this.canvas.height / 2 + 50 - this.rampLength * Math.sin(this.rampAngle);
    
    // 如果物体滑到底部，停止计时
    if (this.currentLevel === 2 && 
        this.physicsObject.x >= rampEndX - this.physicsObject.width &&
        this.physicsObject.y <= rampEndY + this.physicsObject.height) {
      this.metrics.time_to_bottom_s = this.timer;
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
    
    // 绘制斜面
    this.drawRamp();
    
    // 绘制物理对象
    this.physicsObject.render(ctx);
    
    // 绘制受力分解箭头
    this.drawForceVectors();
    
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
  
  private drawRamp() {
    const ctx = this.ctx;
    const startX = this.canvas.width / 2 - 200;
    const startY = this.canvas.height / 2 + 50;
    const endX = startX + this.rampLength * Math.cos(this.rampAngle);
    const endY = startY - this.rampLength * Math.sin(this.rampAngle);
    
    // 绘制斜面
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    
    // 斜面宽度
    const rampWidth = 40;
    ctx.lineTo(endX - rampWidth * Math.sin(this.rampAngle), endY - rampWidth * Math.cos(this.rampAngle));
    ctx.lineTo(startX - rampWidth * Math.sin(this.rampAngle), startY - rampWidth * Math.cos(this.rampAngle));
    ctx.closePath();
    
    // 填充斜面
    const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    gradient.addColorStop(0, '#8B7355');
    gradient.addColorStop(1, '#A0522D');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 斜面边框
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 绘制角度标记
    ctx.fillStyle = 'white';
    ctx.font = '14px Orbitron, monospace';
    ctx.fillText(`${(this.rampAngle * 180 / Math.PI).toFixed(1)}°`, startX + 20, startY - 20);
  }
  
  private drawForceVectors() {
    const ctx = this.ctx;
    const obj = this.physicsObject;
    
    // 重力箭头（向下）
    const gravityStartX = obj.x + obj.width / 2;
    const gravityStartY = obj.y + obj.height / 2;
    const gravityEndY = gravityStartY + 50; // 重力大小的可视化
    
    ctx.beginPath();
    ctx.moveTo(gravityStartX, gravityStartY);
    ctx.lineTo(gravityStartX, gravityEndY);
    ctx.strokeStyle = '#ef4444'; // 红色表示重力
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 重力箭头头
    ctx.beginPath();
    ctx.moveTo(gravityStartX, gravityEndY);
    ctx.lineTo(gravityStartX - 8, gravityEndY - 10);
    ctx.lineTo(gravityStartX + 8, gravityEndY - 10);
    ctx.closePath();
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('重力', gravityStartX, gravityEndY + 15);
    
    // 如果物体在斜面上，绘制分解力
    if (obj.isOnRamp) {
      // 平行于斜面的力（沿斜面向下）
      const parallelStartX = gravityStartX;
      const parallelStartY = gravityStartY;
      const parallelEndX = parallelStartX + 40 * Math.sin(this.rampAngle);
      const parallelEndY = parallelStartY + 40 * Math.cos(this.rampAngle);
      
      ctx.beginPath();
      ctx.moveTo(parallelStartX, parallelStartY);
      ctx.lineTo(parallelEndX, parallelEndY);
      ctx.strokeStyle = '#10b981'; // 绿色表示平行力
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // 平行力箭头头
      const angle = Math.atan2(parallelEndY - parallelStartY, parallelEndX - parallelStartX);
      ctx.beginPath();
      ctx.moveTo(parallelEndX, parallelEndY);
      ctx.lineTo(
        parallelEndX - 8 * Math.cos(angle - Math.PI/6),
        parallelEndY - 8 * Math.sin(angle - Math.PI/6)
      );
      ctx.lineTo(
        parallelEndX - 8 * Math.cos(angle + Math.PI/6),
        parallelEndY - 8 * Math.sin(angle + Math.PI/6)
      );
      ctx.closePath();
      ctx.fillStyle = '#10b981';
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('沿斜面', (parallelStartX + parallelEndX) / 2, (parallelStartY + parallelEndY) / 2 - 10);
      
      // 垂直于斜面的力（压斜面的力）
      const normalStartX = gravityStartX;
      const normalStartY = gravityStartY;
      const normalEndX = normalStartX - 40 * Math.cos(this.rampAngle);
      const normalEndY = normalStartY + 40 * Math.sin(this.rampAngle);
      
      ctx.beginPath();
      ctx.moveTo(normalStartX, normalStartY);
      ctx.lineTo(normalEndX, normalEndY);
      ctx.strokeStyle = '#3b82f6'; // 蓝色表示垂直力
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // 垂直力箭头头
      const normalAngle = Math.atan2(normalEndY - normalStartY, normalEndX - normalStartX);
      ctx.beginPath();
      ctx.moveTo(normalEndX, normalEndY);
      ctx.lineTo(
        normalEndX - 8 * Math.cos(normalAngle - Math.PI/6),
        normalEndY - 8 * Math.sin(normalAngle - Math.PI/6)
      );
      ctx.lineTo(
        normalEndX - 8 * Math.cos(normalAngle + Math.PI/6),
        normalEndY - 8 * Math.sin(normalAngle + Math.PI/6)
      );
      ctx.closePath();
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('垂直斜面', (normalStartX + normalEndX) / 2 - 10, (normalStartY + normalEndY) / 2 + 10);
    }
  }
  
  private drawControlPanel() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 控制面板背景
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(10, height - 200, 350, 190);
    ctx.strokeStyle = 'rgba(74, 108, 245, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, height - 200, 350, 190);
    
    // 标题
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Orbitron, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('摩擦与斜面控制台', 20, height - 180);
    
    // 物理信息
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(`材质: ${MATERIALS[this.physicsObject.material].name}`, 20, height - 160);
    ctx.fillText(`静摩擦系数: ${this.physicsObject.staticFriction.toFixed(2)}`, 20, height - 140);
    ctx.fillText(`动摩擦系数: ${this.physicsObject.kineticFriction.toFixed(2)}`, 20, height - 120);
    ctx.fillText(`斜面角度: ${(this.rampAngle * 180 / Math.PI).toFixed(1)}°`, 20, height - 100);
    ctx.fillText(`质量: ${this.physicsObject.mass}kg`, 20, height - 80);
    ctx.fillText(`状态: ${this.physicsObject.isSliding ? '滑动中' : '静止'}`, 20, height - 60);
    
    // 当前关卡
    ctx.fillText(`当前关卡: ${this.currentLevel}`, 20, height - 40);
    
    // 计时器
    if (this.currentLevel === 2) {
      ctx.fillText(`滑行时间: ${this.timer.toFixed(2)}s`, 20, height - 20);
    }
  }
}

// 初始化函数
export async function init(options: SimInitOptions): Promise<SimController> {
  const frictionRamp = new FrictionRamp(options);
  return frictionRamp;
}