/**
 * 抛体运动沙盒游戏主模块
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

// 轨迹点类
export class TrajectoryPoint {
  x: number;
  y: number;
  time: number;
  
  constructor(x: number, y: number, time: number) {
    this.x = x;
    this.y = y;
    this.time = time;
  }
}

// 抛体对象类
export class Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number = 1.0; // 质量 (kg)
  radius: number = 5; // 半径 (像素)
  active: boolean = true; // 是否在运动中
  
  constructor(x: number, y: number, vx: number, vy: number) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
  }
  
  render(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();
    
    // 边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// 目标类
export class Target {
  x: number;
  y: number;
  radius: number = 20; // 目标半径
  hit: boolean = false; // 是否被命中
  
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  
  render(ctx: CanvasRenderingContext2D) {
    // 绘制目标环
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = this.hit ? '#10b981' : '#ef4444';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 目标中心
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius / 3, 0, Math.PI * 2);
    ctx.fillStyle = this.hit ? '#10b981' : '#ef4444';
    ctx.fill();
    
    // 目标环2
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.65, 0, Math.PI * 2);
    ctx.strokeStyle = this.hit ? '#10b981' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 目标环3
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.3, 0, Math.PI * 2);
    ctx.strokeStyle = this.hit ? '#10b981' : '#ef4444';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  // 检查是否被命中
  checkHit(projectile: Projectile): boolean {
    const distance = Math.sqrt(Math.pow(projectile.x - this.x, 2) + Math.pow(projectile.y - this.y, 2));
    return distance <= (this.radius + projectile.radius);
  }
}

// 障碍物类
export class Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  
  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  
  render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // 边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  }
  
  // 检查是否与抛体碰撞
  checkCollision(projectile: Projectile): boolean {
    return projectile.x + projectile.radius > this.x && 
           projectile.x - projectile.radius < this.x + this.width &&
           projectile.y + projectile.radius > this.y && 
           projectile.y - projectile.radius < this.y + this.height;
  }
}

// 环境配置
export interface EnvironmentConfig {
  gravity: number; // 重力加速度 (m/s²)
  airResistance: boolean; // 是否启用空气阻力
  airDensity: number; // 空气密度 (kg/m³)
  name: string; // 环境名称 (Earth/Moon/Mars)
}

// 抛体沙盒游戏主类
export class ProjectileSandbox implements SimController {
  private container: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private simulationTime: number = 0;
  
  // 游戏状态
  private projectile: Projectile | null = null;
  private trajectory: TrajectoryPoint[] = [];
  private target: Target | null = null;
  private obstacles: Obstacle[] = [];
  private currentLevel: number = 1;
  private metrics: Record<string, number | string | boolean> = {};
  private environment: EnvironmentConfig;
  
  // 物理参数
  private launchAngle: number = 45; // 发射角度 (度)
  private initialSpeed: number = 30; // 初速度 (m/s)
  private gravity: number = 9.8; // 重力加速度 (m/s²)
  private airResistance: boolean = false; // 空气阻力开关
  private airDensity: number = 1.2; // 空气密度 (kg/m³)
  private dragCoefficient: number = 0.47; // 拖拽系数
  
  // 发射参数
  private launchX: number = 50; // 发射点X坐标
  private launchY: number = 0; // 发射点Y坐标 (相对于地面)
  
  // 控制状态
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  
  constructor(private options: SimInitOptions) {
    this.container = options.container;
    this.environment = {
      gravity: 9.8,
      airResistance: false,
      airDensity: 1.2,
      name: 'Earth'
    };
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
    
    // 检查是否点击了目标
    if (this.target && this.target.checkHit(new Projectile(x, y, 0, 0))) {
      this.isDragging = true;
      this.dragStartX = x - this.target.x;
      this.dragStartY = y - this.target.y;
    }
  }
  
  private handleMouseMove(e: MouseEvent) {
    if (this.isDragging && this.target) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // 更新目标位置
      this.target.x = x - this.dragStartX;
      this.target.y = y - this.dragStartY;
      
      // 限制目标位置在画布内
      this.target.x = Math.max(100, Math.min(this.canvas.width - 50, this.target.x));
      this.target.y = Math.max(50, Math.min(this.canvas.height - 100, this.target.y));
    }
  }
  
  private handleMouseUp(e: MouseEvent) {
    if (this.isDragging) {
      this.isDragging = false;
    }
  }
  
  private handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length > 0) {
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // 检查是否点击了目标
      if (this.target && this.target.checkHit(new Projectile(x, y, 0, 0))) {
        this.isDragging = true;
        this.dragStartX = x - this.target.x;
        this.dragStartY = y - this.target.y;
      }
    }
  }
  
  private handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    if (this.isDragging && this.target && e.touches.length > 0) {
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // 更新目标位置
      this.target.x = x - this.dragStartX;
      this.target.y = y - this.dragStartY;
      
      // 限制目标位置在画布内
      this.target.x = Math.max(100, Math.min(this.canvas.width - 50, this.target.x));
      this.target.y = Math.max(50, Math.min(this.canvas.height - 100, this.target.y));
    }
  }
  
  private handleTouchEnd(e: TouchEvent) {
    e.preventDefault();
    if (this.isDragging) {
      this.isDragging = false;
    }
  }
  
  private initSimulation() {
    // 设置发射点
    this.launchX = 50;
    this.launchY = this.canvas.height - 50;
    
    // 初始化目标
    this.target = new Target(this.canvas.width - 150, this.canvas.height - 100);
    
    // 初始化障碍物（根据关卡）
    this.obstacles = [];
    if (this.currentLevel === 3) {
      // 第三关添加障碍物
      this.obstacles = [
        new Obstacle(this.canvas.width / 2 - 50, this.canvas.height - 150, 100, 100)
      ];
    }
    
    // 初始化指标
    this.metrics = {
      hit_error_m: 0,
      min_initial_speed_mps: 0,
      env_profile_used: this.environment.name
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
    this.projectile = null;
    this.trajectory = [];
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
    if (p.launchAngle !== undefined) {
      this.launchAngle = p.launchAngle as number;
    }
    if (p.initialSpeed !== undefined) {
      this.initialSpeed = p.initialSpeed as number;
    }
    if (p.gravity !== undefined) {
      this.gravity = p.gravity as number;
      this.environment.gravity = this.gravity;
    }
    if (p.airResistance !== undefined) {
      this.airResistance = p.airResistance as boolean;
    }
  }
  
  getState(): unknown {
    return {
      projectile: this.projectile ? {
        x: this.projectile.x,
        y: this.projectile.y,
        vx: this.projectile.vx,
        vy: this.projectile.vy
      } : null,
      trajectory: this.trajectory.map(t => ({
        x: t.x,
        y: t.y,
        time: t.time
      })),
      target: this.target ? {
        x: this.target.x,
        y: this.target.y,
        hit: this.target.hit
      } : null,
      currentLevel: this.currentLevel,
      simulationTime: this.simulationTime,
      launchAngle: this.launchAngle,
      initialSpeed: this.initialSpeed,
      gravity: this.gravity,
      airResistance: this.airResistance
    };
  }
  
  setState(s: unknown): void {
    // 在实际实现中会从状态恢复游戏
  }
  
  getMetrics(): Record<string, number | string | boolean> {
    return this.metrics;
  }
  
  private setupLevel(level: number) {
    this.currentLevel = level;
    
    switch (level) {
      case 1:
        // L1: 命中固定靶（误差≤0.5m）
        this.environment = {
          gravity: 9.8,
          airResistance: false,
          airDensity: 1.2,
          name: 'Earth'
        };
        this.target = new Target(this.canvas.width - 150, this.canvas.height - 100);
        this.obstacles = [];
        break;
      case 2:
        // L2: 月球重力命中靶
        this.environment = {
          gravity: 1.62,
          airResistance: false,
          airDensity: 0,
          name: 'Moon'
        };
        this.target = new Target(this.canvas.width - 200, this.canvas.height - 80);
        this.obstacles = [];
        break;
      case 3:
        // L3: 以最小初速越过障碍并命中
        this.environment = {
          gravity: 9.8,
          airResistance: false,
          airDensity: 1.2,
          name: 'Earth'
        };
        this.target = new Target(this.canvas.width - 100, this.canvas.height - 100);
        this.obstacles = [
          new Obstacle(this.canvas.width / 2 - 50, this.canvas.height - 200, 100, 150)
        ];
        break;
      default:
        this.environment = {
          gravity: 9.8,
          airResistance: false,
          airDensity: 1.2,
          name: 'Earth'
        };
        this.target = new Target(this.canvas.width - 150, this.canvas.height - 100);
        this.obstacles = [];
    }
    
    this.projectile = null;
    this.trajectory = [];
  }
  
  // 发射抛体
  public launchProjectile(): void {
    if (this.projectile !== null) return; // 如果已经在运动中，不重新发射
    
    // 将角度转换为弧度
    const angleRad = this.launchAngle * Math.PI / 180;
    
    // 计算初始速度分量
    const vx = this.initialSpeed * Math.cos(angleRad);
    const vy = -this.initialSpeed * Math.sin(angleRad); // 负号是因为y轴向下
    
    // 创建抛体
    this.projectile = new Projectile(this.launchX, this.launchY, vx, vy);
    this.trajectory = [new TrajectoryPoint(this.launchX, this.launchY, 0)];
    
    // 重置目标状态
    if (this.target) {
      this.target.hit = false;
    }
  }
  
  private updatePhysics(dt: number) {
    // 时间步长（秒）
    const dtSec = dt / 1000;
    this.simulationTime += dt;
    
    if (this.projectile && this.projectile.active) {
      // 应用物理更新
      const p = this.projectile;
      
      // 计算空气阻力
      let airResistanceForceX = 0;
      let airResistanceForceY = 0;
      
      if (this.airResistance) {
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const dragForce = 0.5 * this.airDensity * speed * speed * this.dragCoefficient;
        
        if (speed > 0) {
          airResistanceForceX = -dragForce * (p.vx / speed);
          airResistanceForceY = -dragForce * (p.vy / speed);
        }
      }
      
      // 更新速度
      const accelerationX = airResistanceForceX / p.mass;
      const accelerationY = this.gravity + airResistanceForceY / p.mass; // 重力向下为正
      
      p.vx += accelerationX * dtSec;
      p.vy += accelerationY * dtSec;
      
      // 更新位置
      p.x += p.vx * dtSec;
      p.y += p.vy * dtSec;
      
      // 记录轨迹点（每隔一定时间记录一次）
      if (this.trajectory.length === 0 || 
          this.trajectory[this.trajectory.length - 1].time + 0.1 < this.simulationTime / 1000) {
        this.trajectory.push(new TrajectoryPoint(p.x, p.y, this.simulationTime / 1000));
      }
      
      // 检查与目标碰撞
      if (this.target && !this.target.hit) {
        if (this.target.checkHit(p)) {
          this.target.hit = true;
          p.active = false;
          
          // 计算命中误差
          const hitError = Math.sqrt(Math.pow(p.x - this.target.x, 2) + Math.pow(p.y - this.target.y, 2));
          this.metrics.hit_error_m = hitError;
        }
      }
      
      // 检查与障碍物碰撞
      for (const obstacle of this.obstacles) {
        if (obstacle.checkCollision(p)) {
          p.active = false;
          break;
        }
      }
      
      // 检查边界（地面）
      if (p.y > this.canvas.height - 30) {
        p.y = this.canvas.height - 30;
        p.active = false;
      }
      
      // 检查边界（右侧）
      if (p.x > this.canvas.width) {
        p.active = false;
      }
      
      // 检查边界（左侧）
      if (p.x < 0) {
        p.active = false;
      }
      
      // 检查边界（顶部）
      if (p.y < 0) {
        p.active = false;
      }
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
    
    // 绘制地面
    this.drawGround();
    
    // 绘制障碍物
    for (const obstacle of this.obstacles) {
      obstacle.render(ctx);
    }
    
    // 绘制轨迹
    this.drawTrajectory();
    
    // 绘制目标
    if (this.target) {
      this.target.render(ctx);
    }
    
    // 绘制抛体
    if (this.projectile) {
      this.projectile.render(ctx);
    }
    
    // 绘制发射点
    this.drawLaunchPoint();
    
    // 绘制控制面板
    this.drawControlPanel();
  }
  
  private drawBackground() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#87CEEB'); // 天空蓝
    gradient.addColorStop(1, '#E0F6FF'); // 浅蓝色
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  
  private drawGround() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 绘制地面
    ctx.fillStyle = '#8B7355'; // 土色
    ctx.fillRect(0, height - 30, width, 30);
    
    // 绘制草地纹理
    ctx.fillStyle = '#7CFC00'; // 草绿色
    for (let x = 0; x < width; x += 20) {
      ctx.fillRect(x, height - 30, 10, 5);
    }
  }
  
  private drawTrajectory() {
    if (this.trajectory.length < 2) return;
    
    const ctx = this.ctx;
    
    // 绘制轨迹线
    ctx.beginPath();
    ctx.moveTo(this.trajectory[0].x, this.trajectory[0].y);
    
    for (let i = 1; i < this.trajectory.length; i++) {
      ctx.lineTo(this.trajectory[i].x, this.trajectory[i].y);
    }
    
    ctx.strokeStyle = 'rgba(59, 131, 246, 0.7)'; // 半透明蓝色
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 绘制轨迹点（只绘制部分点，避免过于密集）
    const step = Math.max(1, Math.floor(this.trajectory.length / 50));
    for (let i = 0; i < this.trajectory.length; i += step) {
      const point = this.trajectory[i];
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59, 131, 246, 0.5)';
      ctx.fill();
    }
  }
  
  private drawLaunchPoint() {
    const ctx = this.ctx;
    
    // 绘制发射点
    ctx.beginPath();
    ctx.arc(this.launchX, this.launchY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#DC2626'; // 红色
    ctx.fill();
    
    // 发射点中心
    ctx.beginPath();
    ctx.arc(this.launchX, this.launchY, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
  }
  
  private drawControlPanel() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 控制面板背景
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(10, 10, 350, 180);
    ctx.strokeStyle = 'rgba(74, 108, 245, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, 350, 180);
    
    // 标题
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Orbitron, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('抛体运动控制台', 20, 35);
    
    // 发射参数
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(`角度: ${this.launchAngle}°`, 20, 60);
    ctx.fillText(`初速: ${this.initialSpeed.toFixed(1)} m/s`, 20, 80);
    ctx.fillText(`重力: ${this.gravity.toFixed(1)} m/s²`, 20, 100);
    ctx.fillText(`空气阻力: ${this.airResistance ? '开启' : '关闭'}`, 20, 120);
    ctx.fillText(`当前关卡: ${this.currentLevel}`, 20, 140);
    
    // 环境信息
    ctx.fillText(`环境: ${this.environment.name}`, 20, 160);
    
    // 如果有抛体，显示当前状态
    if (this.projectile && this.projectile.active) {
      ctx.fillStyle = '#3b82f6';
      ctx.fillText('飞行中...', 200, 60);
    } else if (this.target && this.target.hit) {
      ctx.fillStyle = '#10b981';
      ctx.fillText('✓ 命中!', 200, 60);
    }
  }
  
  // 计算理论射程（无空气阻力）
  public calculateTheoreticalRange(): number {
    // 公式: R = (v² * sin(2θ)) / g
    const angleRad = this.launchAngle * Math.PI / 180;
    const theoreticalRange = (this.initialSpeed * this.initialSpeed * Math.sin(2 * angleRad)) / this.gravity;
    return theoreticalRange;
  }
  
  // 计算理论最大高度（无空气阻力）
  public calculateTheoreticalMaxHeight(): number {
    // 公式: H = (v² * sin²(θ)) / (2g)
    const angleRad = this.launchAngle * Math.PI / 180;
    const maxHeight = (this.initialSpeed * this.initialSpeed * Math.pow(Math.sin(angleRad), 2)) / (2 * this.gravity);
    return maxHeight;
  }
  
  // 计算理论飞行时间（无空气阻力）
  public calculateTheoreticalFlightTime(): number {
    // 公式: T = (2 * v * sin(θ)) / g
    const angleRad = this.launchAngle * Math.PI / 180;
    const flightTime = (2 * this.initialSpeed * Math.sin(angleRad)) / this.gravity;
    return flightTime;
  }
}

// 初始化函数
export async function init(options: SimInitOptions): Promise<SimController> {
  const projectileSandbox = new ProjectileSandbox(options);
  return projectileSandbox;
}