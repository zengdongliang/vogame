/**
 * 电路故障排除游戏主模块
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

// 电路元件基类
export abstract class CircuitComponent {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected: boolean = false;
  
  constructor(id: string, x: number, y: number, width: number, height: number) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  
  abstract getType(): string;
  abstract render(ctx: CanvasRenderingContext2D): void;
  abstract containsPoint(x: number, y: number): boolean;
}

// 电阻器
export class Resistor extends CircuitComponent {
  resistance: number; // 电阻值 (欧姆)
  
  constructor(id: string, x: number, y: number, resistance: number = 100) {
    super(id, x, y, 60, 30);
    this.resistance = resistance;
  }
  
  getType(): string {
    return 'resistor';
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    // 绘制电阻器
    ctx.fillStyle = this.isSelected ? '#6c63ff' : '#4a6cf5';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // 绘制电阻标识
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${this.resistance}Ω`, this.x + this.width/2, this.y + this.height/2);
    
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

// 电池
export class Battery extends CircuitComponent {
  voltage: number; // 电压值 (伏特)
  
  constructor(id: string, x: number, y: number, voltage: number = 1.5) {
    super(id, x, y, 40, 60);
    this.voltage = voltage;
  }
  
  getType(): string {
    return 'battery';
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    // 绘制电池外壳
    ctx.fillStyle = this.isSelected ? '#6c63ff' : '#4a6cf5';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // 绘制正极
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(this.x + 10, this.y + 10, 20, 5);
    
    // 绘制负极
    ctx.fillRect(this.x + 10, this.y + 20, 20, 15);
    
    // 电压标识
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${this.voltage}V`, this.x + this.width/2, this.y + this.height - 10);
    
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

// 灯泡
export class Bulb extends CircuitComponent {
  brightness: number = 0; // 亮度 (0-1)
  isOn: boolean = false;
  
  constructor(id: string, x: number, y: number) {
    super(id, x, y, 40, 40);
  }
  
  getType(): string {
    return 'bulb';
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    // 绘制灯泡底座
    ctx.fillStyle = this.isSelected ? '#6c63ff' : '#4a6cf5';
    ctx.fillRect(this.x + 15, this.y + 25, 10, 15);
    
    // 绘制灯泡玻璃
    ctx.beginPath();
    ctx.arc(this.x + 20, this.y + 15, 15, 0, Math.PI * 2);
    ctx.fillStyle = this.isOn ? `rgba(255, 255, 0, ${0.3 + this.brightness * 0.7})` : '#cccccc';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // 灯丝
    if (this.isOn) {
      ctx.beginPath();
      ctx.moveTo(this.x + 12, this.y + 10);
      ctx.lineTo(this.x + 28, this.y + 20);
      ctx.strokeStyle = `rgba(255, 165, 0, ${this.brightness})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  
  containsPoint(x: number, y: number): boolean {
    // 检查是否在圆形范围内
    const centerX = this.x + 20;
    const centerY = this.y + 15;
    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    return distance <= 15;
  }
}

// 开关
export class Switch extends CircuitComponent {
  isClosed: boolean = false;
  
  constructor(id: string, x: number, y: number) {
    super(id, x, y, 50, 30);
  }
  
  getType(): string {
    return 'switch';
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    // 绘制开关底座
    ctx.fillStyle = this.isSelected ? '#6c63ff' : '#4a6cf5';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // 绘制开关状态
    ctx.fillStyle = this.isClosed ? '#10b981' : '#ef4444';
    ctx.beginPath();
    ctx.arc(this.x + this.width - 15, this.y + this.height/2, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // 状态文字
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.isClosed ? 'ON' : 'OFF', this.x + 10, this.y + this.height/2);
    
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

// 连接点
export class ConnectionPoint {
  x: number;
  y: number;
  componentId: string | null = null;
  connections: string[] = []; // 连接到的其他点ID
  
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

// 电路连线
export class Wire {
  id: string;
  startComponentId: string;
  endComponentId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  current: number = 0; // 电流 (安培)
  isSelected: boolean = false;
  
  constructor(id: string, startComponentId: string, endComponentId: string, 
              startX: number, startY: number, endX: number, endY: number) {
    this.id = id;
    this.startComponentId = startComponentId;
    this.endComponentId = endComponentId;
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    // 绘制连线
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(this.endX, this.endY);
    
    // 根据电流大小调整线宽和颜色
    const lineWidth = Math.max(2, 2 + this.current * 5);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = this.isSelected ? '#6c63ff' : 
                     this.current > 0 ? '#10b981' : '#94a3b8';
    ctx.stroke();
    
    // 绘制电流方向箭头（如果有电流）
    if (this.current > 0) {
      const midX = (this.startX + this.endX) / 2;
      const midY = (this.startY + this.endY) / 2;
      
      // 计算箭头方向
      const angle = Math.atan2(this.endY - this.startY, this.endX - this.startX);
      
      // 绘制箭头
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(
        midX - 10 * Math.cos(angle - Math.PI/6),
        midY - 10 * Math.sin(angle - Math.PI/6)
      );
      ctx.lineTo(
        midX - 10 * Math.cos(angle + Math.PI/6),
        midY - 10 * Math.sin(angle + Math.PI/6)
      );
      ctx.closePath();
      ctx.fillStyle = '#10b981';
      ctx.fill();
    }
  }
}

// 万用表
export class Multimeter {
  x: number;
  y: number;
  mode: 'voltage' | 'current' | 'resistance' = 'voltage';
  reading: number = 0;
  isMeasuring: boolean = false;
  
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    // 绘制万用表
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(this.x, this.y, 100, 60);
    
    // 显示屏
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(this.x + 10, this.y + 10, 80, 20);
    
    // 显示读数
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const unit = this.mode === 'voltage' ? 'V' : 
                 this.mode === 'current' ? 'A' : 'Ω';
    ctx.fillText(`${this.reading.toFixed(2)}${unit}`, this.x + 50, this.y + 20);
    
    // 模式指示
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Arial';
    ctx.fillText(this.mode.toUpperCase(), this.x + 50, this.y + 45);
    
    // 边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x, this.y, 100, 60);
  }
}

// 电路故障排除游戏主类
export class CircuitDebugger implements SimController {
  private container: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  
  // 游戏状态
  private components: CircuitComponent[] = [];
  private wires: Wire[] = [];
  private multimeter!: Multimeter;
  private selectedComponent: CircuitComponent | null = null;
  private selectedWire: Wire | null = null;
  private currentLevel: number = 1;
  private metrics: Record<string, number | string | boolean> = {};
  
  // 交互状态
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private isConnecting: boolean = false;
  private connectionStartComponent: CircuitComponent | null = null;
  
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
    
    this.handleComponentSelection(x, y);
  }
  
  private handleMouseMove(e: MouseEvent) {
    if (this.isDragging && this.selectedComponent) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      this.selectedComponent.x = x - this.dragStartX;
      this.selectedComponent.y = y - this.dragStartY;
    }
  }
  
  private handleMouseUp(e: MouseEvent) {
    this.isDragging = false;
  }
  
  private handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length > 0) {
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      this.handleComponentSelection(x, y);
    }
  }
  
  private handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    if (this.isDragging && this.selectedComponent && e.touches.length > 0) {
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      this.selectedComponent.x = x - this.dragStartX;
      this.selectedComponent.y = y - this.dragStartY;
    }
  }
  
  private handleTouchEnd(e: TouchEvent) {
    e.preventDefault();
    this.isDragging = false;
  }
  
  private handleComponentSelection(x: number, y: number) {
    // 检查是否点击了元件
    for (let i = this.components.length - 1; i >= 0; i--) {
      const component = this.components[i];
      if (component.containsPoint(x, y)) {
        // 取消之前选中的元件
        if (this.selectedComponent) {
          this.selectedComponent.isSelected = false;
        }
        
        // 选中新的元件
        component.isSelected = true;
        this.selectedComponent = component;
        this.isDragging = true;
        
        // 记录拖拽起始位置
        this.dragStartX = x - component.x;
        this.dragStartY = y - component.y;
        return;
      }
    }
    
    // 如果没有点击到元件，取消选择
    if (this.selectedComponent) {
      this.selectedComponent.isSelected = false;
      this.selectedComponent = null;
    }
  }
  
  private initSimulation() {
    // 初始化不同类型的元件
    this.components = [
      new Battery('battery1', 100, 100, 1.5),
      new Bulb('bulb1', 300, 100),
      new Resistor('resistor1', 200, 150, 100),
      new Switch('switch1', 150, 200)
    ];
    
    // 初始化连线
    this.wires = [
      new Wire('wire1', 'battery1', 'resistor1', 140, 130, 200, 165),
      new Wire('wire2', 'resistor1', 'bulb1', 260, 165, 300, 120)
    ];
    
    // 初始化万用表
    this.multimeter = new Multimeter(400, 300);
    
    // 初始化指标
    this.metrics = {
      short_circuit_count: 0,
      multimeter_usage_count: 0,
      target_current_error_pct: 0
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
    // 更新电路模拟
    this.updateCircuit(dtMs);
  }
  
  setParams(p: Record<string, unknown>): void {
    if (p.level !== undefined) {
      this.currentLevel = p.level as number;
      this.setupLevel(this.currentLevel);
    }
  }
  
  getState(): unknown {
    return {
      components: this.components.map(comp => ({
        id: comp.id,
        type: comp.getType(),
        x: comp.x,
        y: comp.y,
        width: comp.width,
        height: comp.height
      })),
      wires: this.wires.map(wire => ({
        id: wire.id,
        startComponentId: wire.startComponentId,
        endComponentId: wire.endComponentId,
        startX: wire.startX,
        startY: wire.startY,
        endX: wire.endX,
        endY: wire.endY,
        current: wire.current
      })),
      currentLevel: this.currentLevel
    };
  }
  
  setState(s: unknown): void {
    // 在实际实现中会从状态恢复电路
  }
  
  getMetrics(): Record<string, number | string | boolean> {
    return this.metrics;
  }
  
  private setupLevel(level: number) {
    switch (level) {
      case 1:
        // L1: 修复断路 - 创建一个有断开连接的简单电路
        this.components = [
          new Battery('battery1', 100, 100, 1.5),
          new Bulb('bulb1', 300, 100)
        ];
        // 故意断开连线
        this.wires = [];
        break;
      case 2:
        // L2: 防短路 - 创建一个可能短路的电路
        this.components = [
          new Battery('battery1', 100, 100, 1.5),
          new Bulb('bulb1', 300, 100),
          new Resistor('resistor1', 200, 150, 50)
        ];
        this.wires = [
          new Wire('wire1', 'battery1', 'bulb1', 140, 130, 300, 120)
        ];
        break;
      case 3:
        // L3: 亮度匹配 - 创建需要平衡的并联电路
        this.components = [
          new Battery('battery1', 100, 100, 1.5),
          new Bulb('bulb1', 300, 80),
          new Bulb('bulb2', 300, 140),
          new Resistor('resistor1', 200, 80, 100),
          new Resistor('resistor2', 200, 140, 50)
        ];
        this.wires = [
          new Wire('wire1', 'battery1', 'resistor1', 140, 130, 200, 95),
          new Wire('wire2', 'resistor1', 'bulb1', 260, 95, 300, 100),
          new Wire('wire3', 'battery1', 'resistor2', 140, 130, 200, 155),
          new Wire('wire4', 'resistor2', 'bulb2', 260, 155, 300, 160)
        ];
        break;
      default:
        this.initSimulation();
    }
  }
  
  private updateCircuit(dt: number) {
    // 在实际实现中会计算电路中的电流和电压
    // 这里简化处理，只更新灯泡状态
    for (const component of this.components) {
      if (component instanceof Bulb) {
        // 简单模拟：如果有连接就亮
        component.isOn = this.wires.length > 0;
        component.brightness = component.isOn ? 0.8 : 0;
      }
    }
    
    // 更新连线中的电流显示
    for (const wire of this.wires) {
      wire.current = 0.1; // 简化处理
    }
  }
  
  private gameLoop = () => {
    this.updateCircuit(16);
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
    
    // 绘制面包板网格
    this.drawBreadboard();
    
    // 绘制连线
    for (const wire of this.wires) {
      wire.render(ctx);
    }
    
    // 绘制元件
    for (const component of this.components) {
      component.render(ctx);
    }
    
    // 绘制万用表
    this.multimeter.render(ctx);
    
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
  
  private drawBreadboard() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 绘制面包板外观
    ctx.fillStyle = '#334155';
    ctx.fillRect(50, 50, width - 100, height - 100);
    
    // 绘制面包板孔洞网格
    ctx.fillStyle = '#475569';
    for (let x = 70; x < width - 70; x += 25) {
      for (let y = 70; y < height - 70; y += 25) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // 绘制电源轨
    ctx.fillStyle = '#ef4444'; // 红色正极轨
    ctx.fillRect(60, 60, width - 120, 10);
    
    ctx.fillStyle = '#10b981'; // 绿色负极轨
    ctx.fillRect(60, height - 70, width - 120, 10);
  }
  
  private drawControlPanel() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    
    // 控制面板背景
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(10, 10, 300, 120);
    ctx.strokeStyle = 'rgba(74, 108, 245, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, 300, 120);
    
    // 标题
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Orbitron, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('电路故障排除', 20, 35);
    
    // 当前关卡
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(`当前关卡: ${this.currentLevel}`, 20, 60);
    
    // 关卡描述
    let levelDesc = '';
    switch (this.currentLevel) {
      case 1:
        levelDesc = 'L1: 修复断路 - 连接断开的电路';
        break;
      case 2:
        levelDesc = 'L2: 防短路 - 添加限流电阻';
        break;
      case 3:
        levelDesc = 'L3: 亮度匹配 - 平衡并联电路';
        break;
      default:
        levelDesc = `L${this.currentLevel}: 自定义电路`;
    }
    
    ctx.fillText(levelDesc, 20, 80);
    
    // 指标显示
    ctx.fillText(`短路次数: ${this.metrics.short_circuit_count}`, 20, 100);
    ctx.fillText(`万用表使用: ${this.metrics.multimeter_usage_count}`, 20, 120);
  }
}

// 初始化函数
export async function init(options: SimInitOptions): Promise<SimController> {
  const circuitDebugger = new CircuitDebugger(options);
  return circuitDebugger;
}