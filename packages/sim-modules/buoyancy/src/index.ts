/**
 * 浮力实验室主组件
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

// 浮力实验室类
export class BuoyancyLab implements SimController {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private simulationTime: number = 0;
  
  // 游戏状态
  private objects: PhysicalObject[] = [];
  private liquid: Liquid = { density: 1.0, temperature: 20 }; // 液体密度 g/cm³, 温度 °C
  private selectedObject: PhysicalObject | null = null;
  private currentLevel: number = 1;
  private metrics: Record<string, number | string | boolean> = {};
  
  // 交互状态
  private draggingObject: PhysicalObject | null = null;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  
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
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mouseleave', this.handleMouseUp);
    
    // 触摸事件（移动端支持）
    this.canvas.addEventListener('touchstart', this.handleTouchStart);
    this.canvas.addEventListener('touchmove', this.handleTouchMove);
    this.canvas.addEventListener('touchend', this.handleTouchEnd);
  }
  
  private handleMouseDown = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 检查是否点击了物体
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      if (x >= obj.x && x <= obj.x + obj.width && 
          y >= obj.y && y <= obj.y + obj.height) {
        this.draggingObject = obj;
        this.dragOffsetX = x - obj.x;
        this.dragOffsetY = y - obj.y;
        obj.velocityY = 0; // 停止物理运动
        break;
      }
    }
  }
  
  private handleMouseMove = (e: MouseEvent) => {
    if (this.draggingObject) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      this.draggingObject.x = x - this.dragOffsetX;
      this.draggingObject.y = y - this.dragOffsetY;
    }
  }
  
  private handleMouseUp = () => {
    this.draggingObject = null;
  }
  
  private handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // 检查是否点击了物体
      for (let i = this.objects.length - 1; i >= 0; i--) {
        const obj = this.objects[i];
        if (x >= obj.x && x <= obj.x + obj.width && 
            y >= obj.y && y <= obj.y + obj.height) {
          this.draggingObject = obj;
          this.dragOffsetX = x - obj.x;
          this.dragOffsetY = y - obj.y;
          obj.velocityY = 0; // 停止物理运动
          break;
        }
      }
    }
  }
  
  private handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (this.draggingObject && e.touches.length > 0) {
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      this.draggingObject.x = x - this.dragOffsetX;
      this.draggingObject.y = y - this.dragOffsetY;
    }
  }
  
  private handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    this.draggingObject = null;
  }
  
  private initSimulation() {
    // 初始化不同类型的物体
    this.objects = [
      // 木块 (密度 0.6 g/cm³)
      new PhysicalObject(100, 50, 40, 40, 0.6, '#8B4513', '木块'),
      // 塑料块 (密度 0.9 g/cm³)
      new PhysicalObject(200, 50, 40, 40, 0.9, '#1E90FF', '塑料块'),
      // 铁块 (密度 7.8 g/cm³)
      new PhysicalObject(300, 50, 40, 40, 7.8, '#708090', '铁块'),
    ];
    
    // 初始化指标
    this.metrics = {
      max_load_g: 0,
      hover_stable_s: 0,
      density_match_error: 0,
      attempts: 0,
      errors: 0,
      level_complete: false
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
    this.simulationTime = 0;
    this.objects = [
      new PhysicalObject(100, 50, 40, 40, 0.6, '#8B4513', '木块'),
      new PhysicalObject(200, 50, 40, 40, 0.9, '#1E90FF', '塑料块'),
      new PhysicalObject(300, 50, 40, 40, 7.8, '#708090', '铁块'),
    ];
    this.liquid = { density: 1.0, temperature: 20 };
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
    if (p.liquid_density !== undefined) {
      this.liquid.density = p.liquid_density as number;
    }
    if (p.temperature !== undefined) {
      this.liquid.temperature = p.temperature as number;
      // 温度影响液体密度 (简化的线性关系)
      this.liquid.density = 1.0 - (this.liquid.temperature - 20) * 0.0002;
    }
    if (p.level !== undefined) {
      this.currentLevel = p.level as number;
      this.setupLevel(this.currentLevel);
    }
  }
  
  private setupLevel(level: number) {
    switch (level) {
      case 1:
        // L1: 浮沉分类 - 3个不同密度的物体
        this.objects = [
          new PhysicalObject(100, 50, 40, 40, 0.6, '#8B4513', '木块'),
          new PhysicalObject(200, 50, 40, 40, 0.9, '#1E90FF', '塑料块'),
          new PhysicalObject(300, 50, 40, 40, 7.8, '#708090', '铁块'),
        ];
        break;
      case 2:
        // L2: 悬浮挑战 - 物体密度接近液体密度
        this.objects = [
          new PhysicalObject(150, 50, 50, 50, 1.05, '#9370DB', '悬浮块'),
        ];
        this.liquid.density = 1.0;
        break;
      case 3:
        // L3: 纸船载重 - 大型轻质容器
        this.objects = [
          new PhysicalObject(100, 30, 120, 60, 0.2, '#F5DEB3', '纸船'),
        ];
        this.liquid.density = 1.0;
        break;
      default:
        // 默认关卡
        this.objects = [
          new PhysicalObject(100, 50, 40, 40, 0.6, '#8B4513', '木块'),
          new PhysicalObject(200, 50, 40, 40, 0.9, '#1E90FF', '塑料块'),
          new PhysicalObject(300, 50, 40, 40, 7.8, '#708090', '铁块'),
        ];
    }
    
    // 重置指标
    this.metrics = {
      max_load_g: 0,
      hover_stable_s: 0,
      density_match_error: 0,
      attempts: 0,
      errors: 0,
      level_complete: false
    };
  }
  
  private checkLevelCompletion() {
    const liquidSurfaceY = this.canvas.height * 0.7;
    
    switch (this.currentLevel) {
      case 1:
        // L1: 检查是否所有物体都已放入液体中并分类正确
        let allClassified = true;
        for (const obj of this.objects) {
          if (obj.y < liquidSurfaceY) {
            allClassified = false;
            break;
          }
        }
        if (allClassified) {
          this.metrics.level_complete = true;
        }
        break;
      case 2:
        // L2: 检查是否悬浮3秒
        const hoverObject = this.objects[0];
        if (hoverObject && hoverObject.isInLiquid) {
          const buoyancyState = hoverObject.getBuoyancyState(this.liquid.density);
          if (buoyancyState === '悬浮') {
            // 增加悬浮时间
            if (this.metrics.hover_stable_s !== undefined) {
              this.metrics.hover_stable_s = (this.metrics.hover_stable_s as number) + 0.016;
            } else {
              this.metrics.hover_stable_s = 0.016;
            }
            
            // 检查是否达到3秒
            if ((this.metrics.hover_stable_s as number) >= 3) {
              this.metrics.level_complete = true;
            }
          } else {
            // 重置悬浮时间
            this.metrics.hover_stable_s = 0;
          }
        }
        break;
      case 3:
        // L3: 检查纸船是否仍然漂浮且载重最大
        const boat = this.objects[0];
        if (boat && boat.isInLiquid) {
          const buoyancyState = boat.getBuoyancyState(this.liquid.density);
          if (buoyancyState === '漂浮' || buoyancyState === '悬浮') {
            // 计算载重（简化为船的质量）
            const load = boat.mass;
            if (load > (this.metrics.max_load_g as number)) {
              this.metrics.max_load_g = load;
            }
          } else {
            // 船沉了
            this.metrics.level_complete = false;
          }
        }
        break;
    }
  }
  
  getState(): unknown {
    return {
      objects: this.objects.map(obj => obj.getState()),
      liquid: this.liquid,
      currentLevel: this.currentLevel,
      simulationTime: this.simulationTime
    };
  }
  
  setState(s: unknown): void {
    const state = s as any;
    if (state.objects) {
      this.objects = state.objects.map((obj: any) => 
        PhysicalObject.fromState(obj)
      );
    }
    if (state.liquid) {
      this.liquid = state.liquid;
    }
    if (state.currentLevel !== undefined) {
      this.currentLevel = state.currentLevel;
    }
    if (state.simulationTime !== undefined) {
      this.simulationTime = state.simulationTime;
    }
  }
  
  getMetrics(): Record<string, number | string | boolean> {
    return this.metrics;
  }
  
  private gameLoop = () => {
    const now = Date.now();
    const dt = 16; // 固定时间步长 60 FPS
    
    this.updatePhysics(dt);
    this.checkLevelCompletion();
    this.render();
    
    this.simulationTime += dt;
    
    if (this.isRunning) {
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }
  }
  
  private updatePhysics(dt: number) {
    const liquidSurfaceY = this.canvas.height * 0.7;
    
    // 更新每个物体的物理状态
    for (const obj of this.objects) {
      // 如果物体正在被拖拽，不应用物理
      if (this.draggingObject !== obj) {
        obj.update(dt, liquidSurfaceY, this.liquid.density);
      }
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
    
    // 绘制液面
    this.drawLiquidSurface();
    
    // 绘制刻度
    this.drawScale();
    
    // 绘制物体
    for (const obj of this.objects) {
      this.drawObject(obj);
    }
    
    // 绘制力矢量
    for (const obj of this.objects) {
      if (obj.isInLiquid) {
        this.drawForceVectors(obj);
      }
    }
    
    // 绘制控制面板
    this.drawControlPanel();
    
    // 绘制关卡信息
    this.drawLevelInfo();
    
    // 绘制关卡状态
    this.drawLevelStatus();
  }
  
  private drawLevelStatus() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    
    // 根据关卡显示不同信息
    if (this.metrics.level_complete) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.8)'; // 绿色背景
      ctx.fillRect(20, 180, 280, 40);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('关卡完成！', width / 2, 210);
    }
    
    // 显示关卡特定信息
    switch (this.currentLevel) {
      case 2:
        if (this.metrics.hover_stable_s) {
          const time = (this.metrics.hover_stable_s as number).toFixed(1);
          ctx.fillStyle = 'white';
          ctx.font = '14px Inter, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`悬浮时间: ${time}s (目标: 3s)`, 20, 240);
        }
        break;
      case 3:
        if (this.metrics.max_load_g) {
          ctx.fillStyle = 'white';
          ctx.font = '14px Inter, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`最大载重: ${(this.metrics.max_load_g as number).toFixed(1)}g`, 20, 240);
        }
        break;
    }
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
  
  private drawLiquidSurface() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 液体区域
    const liquidHeight = height * 0.7;
    
    // 液体颜色 (根据密度变化)
    const liquidColor = this.getLiquidColor();
    ctx.fillStyle = liquidColor;
    ctx.fillRect(0, liquidHeight, width, height - liquidHeight);
    
    // 液面线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, liquidHeight);
    ctx.lineTo(width, liquidHeight);
    ctx.stroke();
    
    // 液体内部波纹效果
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let y = liquidHeight; y < height; y += 20) {
      ctx.beginPath();
      for (let x = 0; x < width; x += 40) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + 20, y);
      }
      ctx.stroke();
    }
  }
  
  private getLiquidColor(): string {
    // 根据液体密度调整颜色
    const densityFactor = Math.min(1, this.liquid.density);
    const r = Math.floor(50 + 50 * densityFactor);
    const g = Math.floor(100 + 100 * densityFactor);
    const b = Math.floor(200 + 55 * densityFactor);
    return `rgba(${r}, ${g}, ${b}, 0.6)`;
  }
  
  private drawScale() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const liquidHeight = height * 0.7;
    
    // 绘制深度刻度
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'right';
    
    // 每隔50像素画一个刻度
    for (let y = liquidHeight; y < height; y += 50) {
      const depth = Math.round((y - liquidHeight) / (height - liquidHeight) * 100);
      ctx.fillText(`${depth} cm`, 40, y + 4);
      
      // 刻度线
      ctx.beginPath();
      ctx.moveTo(45, y);
      ctx.lineTo(55, y);
      ctx.stroke();
    }
  }
  
  private drawObject(obj: PhysicalObject) {
    const ctx = this.ctx;
    
    // 绘制物体
    ctx.fillStyle = obj.color;
    ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    
    // 添加边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
    
    // 绘制物体标签
    ctx.fillStyle = 'white';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(obj.name, obj.x + obj.width/2, obj.y + obj.height/2);
  }
  
  private drawForceVectors(obj: PhysicalObject) {
    const ctx = this.ctx;
    
    // 计算重力和浮力
    const gravityForce = obj.mass * 9.8; // F_g = m * g
    const buoyancyForce = this.liquid.density * obj.displacedVolume * 9.8; // F_b = ρ * V * g
    
    // 绘制重力矢量 (向下，红色)
    const gravityStartX = obj.x + obj.width / 2;
    const gravityStartY = obj.y + obj.height;
    const gravityEndY = gravityStartY + gravityForce * 0.5; // 按比例放大便于显示
    
    ctx.strokeStyle = '#ef4444'; // 红色表示重力
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(gravityStartX, gravityStartY);
    ctx.lineTo(gravityStartX, gravityEndY);
    ctx.stroke();
    
    // 绘制箭头
    this.drawArrow(ctx, gravityStartX, gravityStartY, gravityStartX, gravityEndY, '#ef4444');
    
    // 绘制浮力矢量 (向上，绿色)
    const buoyancyStartX = obj.x + obj.width / 2;
    const buoyancyStartY = obj.y;
    const buoyancyEndY = buoyancyStartY - buoyancyForce * 0.5; // 按比例放大便于显示
    
    ctx.strokeStyle = '#10b981'; // 绿色表示浮力
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(buoyancyStartX, buoyancyStartY);
    ctx.lineTo(buoyancyStartX, buoyancyEndY);
    ctx.stroke();
    
    // 绘制箭头
    this.drawArrow(ctx, buoyancyStartX, buoyancyStartY, buoyancyStartX, buoyancyEndY, '#10b981');
    
    // 绘制力的数值
    ctx.fillStyle = 'white';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'left';
    
    // 重力数值
    ctx.fillText(`重力: ${gravityForce.toFixed(1)} N`, gravityStartX + 10, gravityStartY + 20);
    
    // 浮力数值
    ctx.fillText(`浮力: ${buoyancyForce.toFixed(1)} N`, buoyancyStartX + 10, buoyancyStartY - 10);
  }
  
  private drawArrow(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string) {
    const headLength = 10; // 箭头长度
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    
    // 主线
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
    // 箭头
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }
  
  private drawControlPanel() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    
    // 控制面板背景
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(10, 10, 300, 150);
    ctx.strokeStyle = 'rgba(74, 108, 245, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, 300, 150);
    
    // 标题
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Orbitron, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('浮力实验室控制台', 20, 35);
    
    // 液体密度显示
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(`液体密度: ${this.liquid.density.toFixed(2)} g/cm³`, 20, 60);
    
    // 温度显示
    ctx.fillText(`温度: ${this.liquid.temperature.toFixed(1)} °C`, 20, 80);
    
    // 当前关卡
    ctx.fillText(`当前关卡: ${this.currentLevel}`, 20, 100);
    
    // 物体信息
    let yOffset = 120;
    for (const obj of this.objects) {
      if (obj.isInLiquid) {
        ctx.fillText(`${obj.name}: 浮沉=${obj.getBuoyancyState(this.liquid.density)}`, 20, yOffset);
        yOffset += 18;
      }
    }
  }
  
  private drawLevelInfo() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    
    // 关卡描述
    let levelDesc = '';
    switch (this.currentLevel) {
      case 1:
        levelDesc = 'L1: 浮沉分类 - 将物体拖入液体观察浮沉状态';
        break;
      case 2:
        levelDesc = 'L2: 悬浮挑战 - 调节液体密度使物体悬浮3秒';
        break;
      case 3:
        levelDesc = 'L3: 纸船载重 - 设计纸船并加载砝码';
        break;
      default:
        levelDesc = `L${this.currentLevel}: 自定义实验`;
    }
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '14px Orbitron, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(levelDesc, width - 20, 30);
  }
}

// 物理对象类
class PhysicalObject {
  mass: number;
  volume: number;
  isInLiquid = false;
  velocityY = 0; // 垂直速度
  accelerationY = 0; // 垂直加速度
  displacedVolume = 0; // 排开液体体积
  
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    public density: number, // g/cm³
    public color: string,
    public name: string
  ) {
    this.volume = width * height * 0.1; // 假设厚度0.1cm
    this.mass = this.volume * this.density;
  }
  
  update(dt: number, liquidSurfaceY: number, liquidDensity: number) {
    // 检查是否进入液体
    if (this.y + this.height >= liquidSurfaceY) {
      this.isInLiquid = true;
      
      // 计算排开液体的体积（部分浸入时）
      const submergedHeight = Math.min(this.height, (this.y + this.height) - liquidSurfaceY);
      this.displacedVolume = this.width * submergedHeight * 0.1;
      
      // 计算浮力
      const buoyancyForce = liquidDensity * this.displacedVolume * 9.8; // F_b = ρ * V * g
      
      // 计算重力
      const gravityForce = this.mass * 9.8; // F_g = m * g
      
      // 计算净力（忽略空气中的浮力）
      const netForce = gravityForce - buoyancyForce;
      
      // 计算加速度 F = ma => a = F/m
      this.accelerationY = netForce / this.mass;
      
      // 更新速度和位置
      this.velocityY += this.accelerationY * (dt / 1000); // 转换为秒
      this.y += this.velocityY * (dt / 1000) * 100; // 像素/秒，调整比例
      
      // 防止物体穿出底部
      const bottomY = liquidSurfaceY + 300; // 假设液体深度
      if (this.y + this.height > bottomY) {
        this.y = bottomY - this.height;
        this.velocityY = 0;
        this.accelerationY = 0;
      }
      
      // 如果物体浮起，限制在液面上方
      if (this.y < liquidSurfaceY - this.height) {
        this.y = liquidSurfaceY - this.height;
        this.velocityY = 0;
        this.accelerationY = 0;
      }
    } else {
      this.isInLiquid = false;
      // 在空气中，仅受重力影响
      this.accelerationY = 9.8; // 重力加速度
      this.velocityY += this.accelerationY * (dt / 1000);
      this.y += this.velocityY * (dt / 1000) * 100;
    }
  }
  
  applyForce(force: { fx: number, fy: number }) {
    // 应用外力
    if (this.mass > 0) {
      this.accelerationY += force.fy / this.mass;
    }
  }
  
  getBuoyancyState(liquidDensity: number): string {
    if (this.density < liquidDensity) {
      return '漂浮';
    } else if (Math.abs(this.density - liquidDensity) < 0.01) {
      return '悬浮';
    } else {
      return '下沉';
    }
  }
  
  getState() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      density: this.density,
      color: this.color,
      name: this.name,
      mass: this.mass,
      volume: this.volume,
      isInLiquid: this.isInLiquid,
      velocityY: this.velocityY,
      accelerationY: this.accelerationY,
      displacedVolume: this.displacedVolume
    };
  }
  
  static fromState(state: any) {
    const obj = new PhysicalObject(
      state.x,
      state.y,
      state.width,
      state.height,
      state.density,
      state.color,
      state.name
    );
    obj.mass = state.mass;
    obj.volume = state.volume;
    obj.isInLiquid = state.isInLiquid;
    obj.velocityY = state.velocityY || 0;
    obj.accelerationY = state.accelerationY || 0;
    obj.displacedVolume = state.displacedVolume || 0;
    return obj;
  }
}

// 液体接口
interface Liquid {
  density: number; // g/cm³
  temperature: number; // °C
}

// 初始化函数
export async function init(options: SimInitOptions): Promise<SimController> {
  const buoyancyLab = new BuoyancyLab(options);
  return buoyancyLab;
}