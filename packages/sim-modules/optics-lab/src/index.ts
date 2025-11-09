/**
 * 光学实验室游戏主模块
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

// 点类
export class Point {
  x: number;
  y: number;
  
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  
  distanceTo(other: Point): number {
    return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
  }
}

// 光线类
export class Ray {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  intensity: number = 1.0; // 光线强度 (0-1)
  active: boolean = true; // 是否活跃
  
  constructor(startX: number, startY: number, endX: number, endY: number, intensity: number = 1.0) {
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.intensity = intensity;
  }
  
  render(ctx: CanvasRenderingContext2D) {
    if (!this.active) return;
    
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(this.endX, this.endY);
    
    // 根据强度设置颜色和透明度
    const alpha = Math.min(1.0, this.intensity * 0.8 + 0.2);
    ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`; // 黄色光线
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 绘制箭头表示方向
    const angle = Math.atan2(this.endY - this.startY, this.endX - this.startX);
    const arrowSize = 8;
    
    ctx.beginPath();
    ctx.moveTo(this.endX, this.endY);
    ctx.lineTo(
      this.endX - arrowSize * Math.cos(angle - Math.PI / 6),
      this.endY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      this.endX - arrowSize * Math.cos(angle + Math.PI / 6),
      this.endY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
    ctx.fill();
  }
  
  // 获取光线长度
  getLength(): number {
    return Math.sqrt(
      Math.pow(this.endX - this.startX, 2) + 
      Math.pow(this.endY - this.startY, 2)
    );
  }
  
  // 获取光线方向向量
  getDirection(): { x: number, y: number } {
    const length = this.getLength();
    if (length === 0) return { x: 1, y: 0 };
    return {
      x: (this.endX - this.startX) / length,
      y: (this.endY - this.startY) / length
    };
  }
}

// 传感器类
export class Sensor {
  x: number;
  y: number;
  radius: number = 15;
  detected: boolean = false; // 是否检测到光线
  intensity: number = 0; // 接收到的光线强度
  
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  
  render(ctx: CanvasRenderingContext2D) {
    // 绘制传感器外圈
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = this.detected ? '#10b981' : '#ef4444';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 绘制传感器中心
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius / 2, 0, Math.PI * 2);
    ctx.fillStyle = this.detected ? '#10b981' : '#ef4444';
    ctx.fill();
    
    // 如果检测到光线，显示强度
    if (this.detected && this.intensity > 0) {
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${Math.round(this.intensity * 100)}%`, this.x, this.y + this.radius + 15);
    }
  }
  
  // 检查是否被光线击中
  checkHit(ray: Ray): boolean {
    // 计算光线到传感器中心的最短距离
    const dx = ray.endX - ray.startX;
    const dy = ray.endY - ray.startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return false;
    
    const t = ((this.x - ray.startX) * dx + (this.y - ray.startY) * dy) / (length * length);
    const clampedT = Math.max(0, Math.min(1, t));
    
    const closestX = ray.startX + clampedT * dx;
    const closestY = ray.startY + clampedT * dy;
    
    const distance = Math.sqrt(
      Math.pow(closestX - this.x, 2) + 
      Math.pow(closestY - this.y, 2)
    );
    
    return distance <= this.radius;
  }
  
  // 更新检测状态
  updateDetection(rays: Ray[]) {
    this.detected = false;
    this.intensity = 0;
    
    for (const ray of rays) {
      if (this.checkHit(ray) && ray.active) {
        this.detected = true;
        this.intensity = Math.max(this.intensity, ray.intensity);
      }
    }
  }
}

// 光学元件基类
export abstract class OpticalElement {
  x: number;
  y: number;
  rotation: number = 0; // 旋转角度（弧度）
  refractiveIndex: number = 1.5; // 折射率
  isDragging: boolean = false;
  
  constructor(x: number, y: number, refractiveIndex: number = 1.5) {
    this.x = x;
    this.y = y;
    this.refractiveIndex = refractiveIndex;
  }
  
  abstract render(ctx: CanvasRenderingContext2D): void;
  abstract containsPoint(x: number, y: number): boolean;
  abstract calculateReflection(ray: Ray): Ray | null;
  abstract calculateRefraction(ray: Ray, fromOutside: boolean): Ray | null;
}

// 平面镜类
export class PlaneMirror extends OpticalElement {
  width: number = 100;
  height: number = 10;
  
  constructor(x: number, y: number, rotation: number = 0) {
    super(x, y, 1.0); // 镜子没有折射率
    this.rotation = rotation;
  }
  
  render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    
    // 绘制镜面
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
    
    // 绘制镜面反射层
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height/3);
    
    // 绘制边框
    ctx.strokeStyle = '#808080';
    ctx.lineWidth = 1;
    ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
    
    ctx.restore();
  }
  
  containsPoint(x: number, y: number): boolean {
    // 转换到镜面本地坐标系
    const dx = x - this.x;
    const dy = y - this.y;
    const rotatedX = dx * Math.cos(-this.rotation) - dy * Math.sin(-this.rotation);
    const rotatedY = dx * Math.sin(-this.rotation) + dy * Math.cos(-this.rotation);
    
    return (
      rotatedX >= -this.width/2 && 
      rotatedX <= this.width/2 && 
      rotatedY >= -this.height/2 && 
      rotatedY <= this.height/2
    );
  }
  
  // 计算反射光线
  calculateReflection(ray: Ray): Ray | null {
    // 计算镜面法线向量（垂直于镜面）
    const normalX = Math.sin(this.rotation);
    const normalY = -Math.cos(this.rotation);
    
    // 计算入射向量
    const incidentX = ray.endX - ray.startX;
    const incidentY = ray.endY - ray.startY;
    const incidentLength = Math.sqrt(incidentX * incidentX + incidentY * incidentY);
    
    if (incidentLength === 0) return null;
    
    const incidentDirX = incidentX / incidentLength;
    const incidentDirY = incidentY / incidentLength;
    
    // 计算反射向量 (R = I - 2(I·N)N)
    const dot = incidentDirX * normalX + incidentDirY * normalY;
    const reflectDirX = incidentDirX - 2 * dot * normalX;
    const reflectDirY = incidentDirY - 2 * dot * normalY;
    
    // 计算交点
    const intersection = this.calculateIntersection(ray);
    if (!intersection) return null;
    
    // 创建反射光线
    const newEndX = intersection.x + reflectDirX * 200;
    const newEndY = intersection.y + reflectDirY * 200;
    
    return new Ray(intersection.x, intersection.y, newEndX, newEndY, ray.intensity * 0.95);
  }
  
  // 计算折射光线（镜子不折射）
  calculateRefraction(ray: Ray, fromOutside: boolean): Ray | null {
    return null;
  }
  
  // 计算光线与镜面的交点
  private calculateIntersection(ray: Ray): Point | null {
    // 镜面线段的两个端点
    const mirrorStartX = this.x - (this.width/2) * Math.cos(this.rotation);
    const mirrorStartY = this.y - (this.width/2) * Math.sin(this.rotation);
    const mirrorEndX = this.x + (this.width/2) * Math.cos(this.rotation);
    const mirrorEndY = this.y + (this.width/2) * Math.sin(this.rotation);
    
    // 光线线段的两个端点
    const rayStartX = ray.startX;
    const rayStartY = ray.startY;
    const rayEndX = ray.endX;
    const rayEndY = ray.endY;
    
    // 计算交点
    const denom = (mirrorStartX - mirrorEndX) * (rayStartY - rayEndY) - 
                  (mirrorStartY - mirrorEndY) * (rayStartX - rayEndX);
    
    if (Math.abs(denom) < 1e-10) return null; // 平行线
    
    const t = ((mirrorStartX - rayStartX) * (rayStartY - rayEndY) - 
               (mirrorStartY - rayStartY) * (rayStartX - rayEndX)) / denom;
    const u = -((mirrorStartX - mirrorEndX) * (mirrorStartY - rayStartY) - 
                (mirrorStartY - mirrorEndY) * (mirrorStartX - rayStartX)) / denom;
    
    // 检查交点是否在线段上
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      const intersectionX = mirrorStartX + t * (mirrorEndX - mirrorStartX);
      const intersectionY = mirrorStartY + t * (mirrorEndY - mirrorStartY);
      return new Point(intersectionX, intersectionY);
    }
    
    return null;
  }
}

// 透镜基类
export abstract class Lens extends OpticalElement {
  focalLength: number = 50; // 焦距
  aperture: number = 80; // 孔径
  
  constructor(x: number, y: number, focalLength: number = 50, refractiveIndex: number = 1.5) {
    super(x, y, refractiveIndex);
    this.focalLength = focalLength;
  }
  
  // 计算折射光线
  calculateRefraction(ray: Ray, fromOutside: boolean): Ray | null {
    // 计算与透镜的交点
    const intersection = this.calculateIntersection(ray);
    if (!intersection) return null;
    
    // 计算法线向量
    const normal = this.calculateNormal(intersection);
    if (!normal) return null;
    
    // 计算入射角
    const incidentDir = ray.getDirection();
    
    // 计算折射角（斯涅尔定律）
    const n1 = fromOutside ? 1.0 : this.refractiveIndex; // 入射介质折射率
    const n2 = fromOutside ? this.refractiveIndex : 1.0; // 折射介质折射率
    
    const cosI = -(incidentDir.x * normal.x + incidentDir.y * normal.y);
    const sinT2 = Math.pow(n1/n2, 2) * (1 - Math.pow(cosI, 2));
    
    // 检查全反射
    if (sinT2 > 1) {
      // 全反射，计算反射光线
      const reflectDirX = incidentDir.x - 2 * (incidentDir.x * normal.x + incidentDir.y * normal.y) * normal.x;
      const reflectDirY = incidentDir.y - 2 * (incidentDir.x * normal.x + incidentDir.y * normal.y) * normal.y;
      
      const newEndX = intersection.x + reflectDirX * 200;
      const newEndY = intersection.y + reflectDirY * 200;
      
      return new Ray(intersection.x, intersection.y, newEndX, newEndY, ray.intensity * 0.9);
    }
    
    // 计算折射向量
    const cosT = Math.sqrt(1 - sinT2);
    const refractDirX = (n1/n2) * incidentDir.x + ((n1/n2) * cosI - cosT) * normal.x;
    const refractDirY = (n1/n2) * incidentDir.y + ((n1/n2) * cosI - cosT) * normal.y;
    
    // 创建折射光线
    const newEndX = intersection.x + refractDirX * 200;
    const newEndY = intersection.y + refractDirY * 200;
    
    return new Ray(intersection.x, intersection.y, newEndX, newEndY, ray.intensity * 0.95);
  }
  
  // 计算反射光线
  calculateReflection(ray: Ray): Ray | null {
    // 计算与透镜的交点
    const intersection = this.calculateIntersection(ray);
    if (!intersection) return null;
    
    // 计算法线向量
    const normal = this.calculateNormal(intersection);
    if (!normal) return null;
    
    // 计算入射向量
    const incidentDir = ray.getDirection();
    
    // 计算反射向量 (R = I - 2(I·N)N)
    const dot = incidentDir.x * normal.x + incidentDir.y * normal.y;
    const reflectDirX = incidentDir.x - 2 * dot * normal.x;
    const reflectDirY = incidentDir.y - 2 * dot * normal.y;
    
    // 创建反射光线
    const newEndX = intersection.x + reflectDirX * 200;
    const newEndY = intersection.y + reflectDirY * 200;
    
    return new Ray(intersection.x, intersection.y, newEndX, newEndY, ray.intensity * 0.8);
  }
  
  abstract calculateIntersection(ray: Ray): Point | null;
  abstract calculateNormal(point: Point): { x: number, y: number } | null;
}

// 凸透镜类
export class ConvexLens extends Lens {
  constructor(x: number, y: number, focalLength: number = 50, refractiveIndex: number = 1.5) {
    super(x, y, focalLength, refractiveIndex);
  }
  
  render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // 绘制透镜轮廓（双凸透镜）
    ctx.beginPath();
    ctx.ellipse(0, 0, this.aperture/2, this.aperture/2, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(173, 216, 230, 0.7)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 绘制透镜填充
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.aperture/2);
    gradient.addColorStop(0, 'rgba(173, 216, 230, 0.3)');
    gradient.addColorStop(1, 'rgba(173, 216, 230, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 绘制焦点标记
    ctx.beginPath();
    ctx.arc(this.focalLength, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ff6b6b';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(-this.focalLength, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ff6b6b';
    ctx.fill();
    
    // 焦点标签
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('F', this.focalLength, -15);
    ctx.fillText('F', -this.focalLength, -15);
    
    ctx.restore();
  }
  
  containsPoint(x: number, y: number): boolean {
    const distance = Math.sqrt(Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2));
    return distance <= this.aperture/2;
  }
  
  // 计算光线与透镜的交点
  calculateIntersection(ray: Ray): Point | null {
    // 简化处理：假设透镜是圆形的
    const dx = ray.endX - ray.startX;
    const dy = ray.endY - ray.startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return null;
    
    // 光线参数方程: P = P0 + t * D
    const rayDirX = dx / length;
    const rayDirY = dy / length;
    
    // 圆心在(this.x, this.y)，半径为aperture/2
    const cx = this.x;
    const cy = this.y;
    const r = this.aperture / 2;
    
    // 计算光线与圆的交点
    const ocX = ray.startX - cx;
    const ocY = ray.startY - cy;
    
    const a = rayDirX * rayDirX + rayDirY * rayDirY;
    const b = 2 * (ocX * rayDirX + ocY * rayDirY);
    const c = ocX * ocX + ocY * ocY - r * r;
    
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0) return null; // 无交点
    
    const sqrtDiscriminant = Math.sqrt(discriminant);
    const t1 = (-b - sqrtDiscriminant) / (2 * a);
    const t2 = (-b + sqrtDiscriminant) / (2 * a);
    
    // 选择最近的交点（且在光线前进方向上）
    let t = t1;
    if (t < 0) t = t2;
    if (t < 0) return null;
    
    const intersectionX = ray.startX + t * rayDirX;
    const intersectionY = ray.startY + t * rayDirY;
    
    return new Point(intersectionX, intersectionY);
  }
  
  // 计算法线向量
  calculateNormal(point: Point): { x: number, y: number } | null {
    // 对于圆形透镜，法线方向是从圆心指向交点
    const normalX = point.x - this.x;
    const normalY = point.y - this.y;
    const length = Math.sqrt(normalX * normalX + normalY * normalY);
    
    if (length === 0) return null;
    
    return {
      x: normalX / length,
      y: normalY / length
    };
  }
}

// 光源类
export class LightSource {
  x: number;
  y: number;
  intensity: number = 1.0; // 光源强度
  isDragging: boolean = false;
  rays: Ray[] = []; // 发射的光线
  
  constructor(x: number, y: number, intensity: number = 1.0) {
    this.x = x;
    this.y = y;
    this.intensity = intensity;
    this.generateRays();
  }
  
  render(ctx: CanvasRenderingContext2D) {
    // 绘制光源
    ctx.beginPath();
    ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
    
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 10);
    gradient.addColorStop(0, '#ffff00');
    gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 光源中心
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  
  containsPoint(x: number, y: number): boolean {
    const distance = Math.sqrt(Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2));
    return distance <= 10;
  }
  
  // 生成光线
  private generateRays() {
    this.rays = [];
    
    // 生成多个方向的光线
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const endX = this.x + Math.cos(angle) * 200;
      const endY = this.y + Math.sin(angle) * 200;
      this.rays.push(new Ray(this.x, this.y, endX, endY, this.intensity));
    }
  }
  
  // 更新光线位置
  updatePosition() {
    for (const ray of this.rays) {
      const dx = ray.endX - ray.startX;
      const dy = ray.endY - ray.startY;
      ray.startX = this.x;
      ray.startY = this.y;
      ray.endX = this.x + dx;
      ray.endY = this.y + dy;
    }
  }
}

// 屏幕类（用于成像）
export class Screen {
  x: number;
  y: number;
  width: number = 10;
  height: number = 100;
  isDragging: boolean = false;
  intensityMap: number[] = []; // 像素强度分布
  
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.intensityMap = new Array(20).fill(0); // 20个像素点
  }
  
  render(ctx: CanvasRenderingContext2D) {
    // 绘制屏幕
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
    
    // 绘制边框
    ctx.strokeStyle = '#718096';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
    
    // 绘制强度分布
    const pixelHeight = this.height / this.intensityMap.length;
    for (let i = 0; i < this.intensityMap.length; i++) {
      const intensity = this.intensityMap[i];
      if (intensity > 0) {
        const pixelY = this.y - this.height/2 + i * pixelHeight;
        ctx.fillStyle = `rgba(255, 255, 0, ${intensity})`;
        ctx.fillRect(this.x - this.width/2, pixelY, this.width, pixelHeight);
      }
    }
  }
  
  containsPoint(x: number, y: number): boolean {
    return (
      x >= this.x - this.width/2 && 
      x <= this.x + this.width/2 && 
      y >= this.y - this.height/2 && 
      y <= this.y + this.height/2
    );
  }
  
  // 更新强度分布
  updateIntensity(rays: Ray[]) {
    // 重置强度分布
    this.intensityMap = new Array(20).fill(0);
    
    // 计算每个光线在屏幕上的交点
    for (const ray of rays) {
      if (!ray.active) continue;
      
      // 计算光线与屏幕的交点
      // 屏幕是垂直线 x = this.x
      const t = (this.x - ray.startX) / (ray.endX - ray.startX);
      
      if (t >= 0 && t <= 1) {
        const intersectionY = ray.startY + t * (ray.endY - ray.startY);
        
        // 检查交点是否在屏幕范围内
        if (intersectionY >= this.y - this.height/2 && intersectionY <= this.y + this.height/2) {
          // 计算在屏幕上的位置（0-19）
          const position = (intersectionY - (this.y - this.height/2)) / this.height;
          const pixelIndex = Math.min(19, Math.max(0, Math.floor(position * 20)));
          
          // 更新强度（累加）
          this.intensityMap[pixelIndex] = Math.min(1.0, this.intensityMap[pixelIndex] + ray.intensity * 0.1);
        }
      }
    }
  }
}

// 光学实验室游戏主类
export class OpticsLab implements SimController {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private simulationTime: number = 0;
  
  // 游戏状态
  private lightSource: LightSource | null = null;
  private sensors: Sensor[] = [];
  private opticalElements: OpticalElement[] = [];
  private screens: Screen[] = [];
  private rays: Ray[] = []; // 所有活跃光线
  private currentLevel: number = 1;
  private metrics: Record<string, number | string | boolean> = {};
  
  // 控制状态
  private selectedElement: OpticalElement | LightSource | Sensor | Screen | null = null;
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
    
    // 检查是否点击了光源
    if (this.lightSource && this.lightSource.containsPoint(x, y)) {
      this.selectedElement = this.lightSource;
      this.lightSource.isDragging = true;
      this.dragStartX = x - this.lightSource.x;
      this.dragStartY = y - this.lightSource.y;
      return;
    }
    
    // 检查是否点击了传感器
    for (const sensor of this.sensors) {
      if (sensor.containsPoint(x, y)) {
        this.selectedElement = sensor;
        sensor.isDragging = true;
        this.dragStartX = x - sensor.x;
        this.dragStartY = y - sensor.y;
        return;
      }
    }
    
    // 检查是否点击了屏幕
    for (const screen of this.screens) {
      if (screen.containsPoint(x, y)) {
        this.selectedElement = screen;
        screen.isDragging = true;
        this.dragStartX = x - screen.x;
        this.dragStartY = y - screen.y;
        return;
      }
    }
    
    // 检查是否点击了光学元件
    for (const element of this.opticalElements) {
      if (element.containsPoint(x, y)) {
        this.selectedElement = element;
        element.isDragging = true;
        this.dragStartX = x - element.x;
        this.dragStartY = y - element.y;
        return;
      }
    }
  }
  
  private handleMouseMove(e: MouseEvent) {
    if (this.selectedElement && this.isDragging) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // 更新元素位置
      if (this.selectedElement instanceof LightSource) {
        this.selectedElement.x = x - this.dragStartX;
        this.selectedElement.y = y - this.dragStartY;
        this.selectedElement.updatePosition();
      } else if (this.selectedElement instanceof Sensor) {
        this.selectedElement.x = x - this.dragStartX;
        this.selectedElement.y = y - this.dragStartY;
      } else if (this.selectedElement instanceof Screen) {
        this.selectedElement.x = x - this.dragStartX;
        this.selectedElement.y = y - this.dragStartY;
      } else if (this.selectedElement instanceof OpticalElement) {
        this.selectedElement.x = x - this.dragStartX;
        this.selectedElement.y = y - this.dragStartY;
      }
    }
  }
  
  private handleMouseUp(e: MouseEvent) {
    if (this.selectedElement) {
      if (this.selectedElement instanceof LightSource) {
        this.selectedElement.isDragging = false;
      } else if (this.selectedElement instanceof Sensor) {
        this.selectedElement.isDragging = false;
      } else if (this.selectedElement instanceof Screen) {
        this.selectedElement.isDragging = false;
      } else if (this.selectedElement instanceof OpticalElement) {
        this.selectedElement.isDragging = false;
      }
      this.selectedElement = null;
    }
    this.isDragging = false;
  }
  
  private handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length > 0) {
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // 检查是否点击了光源
      if (this.lightSource && this.lightSource.containsPoint(x, y)) {
        this.selectedElement = this.lightSource;
        this.lightSource.isDragging = true;
        this.dragStartX = x - this.lightSource.x;
        this.dragStartY = y - this.lightSource.y;
        return;
      }
      
      // 检查是否点击了传感器
      for (const sensor of this.sensors) {
        if (sensor.containsPoint(x, y)) {
          this.selectedElement = sensor;
          sensor.isDragging = true;
          this.dragStartX = x - sensor.x;
          this.dragStartY = y - sensor.y;
          return;
        }
      }
      
      // 检查是否点击了屏幕
      for (const screen of this.screens) {
        if (screen.containsPoint(x, y)) {
          this.selectedElement = screen;
          screen.isDragging = true;
          this.dragStartX = x - screen.x;
          this.dragStartY = y - screen.y;
          return;
        }
      }
      
      // 检查是否点击了光学元件
      for (const element of this.opticalElements) {
        if (element.containsPoint(x, y)) {
          this.selectedElement = element;
          element.isDragging = true;
          this.dragStartX = x - element.x;
          this.dragStartY = y - element.y;
          return;
        }
      }
    }
  }
  
  private handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    if (this.selectedElement && this.isDragging && e.touches.length > 0) {
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // 更新元素位置
      if (this.selectedElement instanceof LightSource) {
        this.selectedElement.x = x - this.dragStartX;
        this.selectedElement.y = y - this.dragStartY;
        this.selectedElement.updatePosition();
      } else if (this.selectedElement instanceof Sensor) {
        this.selectedElement.x = x - this.dragStartX;
        this.selectedElement.y = y - this.dragStartY;
      } else if (this.selectedElement instanceof Screen) {
        this.selectedElement.x = x - this.dragStartX;
        this.selectedElement.y = y - this.dragStartY;
      } else if (this.selectedElement instanceof OpticalElement) {
        this.selectedElement.x = x - this.dragStartX;
        this.selectedElement.y = y - this.dragStartY;
      }
    }
  }
  
  private handleTouchEnd(e: TouchEvent) {
    e.preventDefault();
    if (this.selectedElement) {
      if (this.selectedElement instanceof LightSource) {
        this.selectedElement.isDragging = false;
      } else if (this.selectedElement instanceof Sensor) {
        this.selectedElement.isDragging = false;
      } else if (this.selectedElement instanceof Screen) {
        this.selectedElement.isDragging = false;
      } else if (this.selectedElement instanceof OpticalElement) {
        this.selectedElement.isDragging = false;
      }
      this.selectedElement = null;
    }
    this.isDragging = false;
  }
  
  private initSimulation() {
    // 初始化光源
    this.lightSource = new LightSource(100, this.canvas.height / 2);
    
    // 初始化传感器
    this.sensors = [
      new Sensor(this.canvas.width - 100, this.canvas.height / 2)
    ];
    
    // 初始化光学元件
    this.opticalElements = [
      new PlaneMirror(this.canvas.width / 2, this.canvas.height / 2, Math.PI / 4)
    ];
    
    // 初始化屏幕
    this.screens = [];
    
    // 初始化指标
    this.metrics = {
      target_irradiance_pct: 0,
      focus_quality_score: 0,
      total_internal_reflection_usage: 0
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
      lightSource: this.lightSource ? {
        x: this.lightSource.x,
        y: this.lightSource.y,
        intensity: this.lightSource.intensity
      } : null,
      sensors: this.sensors.map(s => ({
        x: s.x,
        y: s.y,
        detected: s.detected,
        intensity: s.intensity
      })),
      opticalElements: this.opticalElements.map(e => {
        if (e instanceof PlaneMirror) {
          return {
            type: 'mirror',
            x: e.x,
            y: e.y,
            rotation: e.rotation
          };
        } else if (e instanceof ConvexLens) {
          return {
            type: 'convexLens',
            x: e.x,
            y: e.y,
            focalLength: e.focalLength,
            refractiveIndex: e.refractiveIndex
          };
        }
        return null;
      }).filter(e => e !== null),
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
    this.currentLevel = level;
    
    switch (level) {
      case 1:
        // L1: 平面镜反射入门（到达目标点）
        this.lightSource = new LightSource(100, this.canvas.height / 2);
        this.sensors = [
          new Sensor(this.canvas.width - 100, this.canvas.height / 2 - 50)
        ];
        this.opticalElements = [
          new PlaneMirror(this.canvas.width / 2, this.canvas.height / 2, Math.PI / 6)
        ];
        this.screens = [];
        break;
      case 2:
        // L2: 凸透镜聚焦提高目标亮度
        this.lightSource = new LightSource(100, this.canvas.height / 2);
        this.sensors = [];
        this.opticalElements = [
          new ConvexLens(this.canvas.width / 2, this.canvas.height / 2, 80)
        ];
        this.screens = [
          new Screen(this.canvas.width - 100, this.canvas.height / 2)
        ];
        break;
      case 3:
        // L3: 利用全反射引导到复杂目标
        this.lightSource = new LightSource(100, this.canvas.height / 2 - 50);
        this.sensors = [
          new Sensor(this.canvas.width - 100, this.canvas.height / 2 + 50)
        ];
        this.opticalElements = [
          new ConvexLens(this.canvas.width / 3, this.canvas.height / 2, 60, 2.0), // 高折射率透镜
          new PlaneMirror(this.canvas.width * 2/3, this.canvas.height / 2 + 30, -Math.PI / 6)
        ];
        this.screens = [];
        break;
      default:
        this.initSimulation();
    }
  }
  
  private updatePhysics(dt: number) {
    // 时间步长（秒）
    const dtSec = dt / 1000;
    this.simulationTime += dt;
    
    // 重置所有光线
    this.rays = [];
    
    // 如果有光源，生成光线
    if (this.lightSource) {
      // 更新传感器检测
      for (const sensor of this.sensors) {
        sensor.updateDetection(this.lightSource.rays);
      }
      
      // 更新屏幕强度
      for (const screen of this.screens) {
        screen.updateIntensity(this.lightSource.rays);
      }
      
      // 处理光线与光学元件的交互
      for (const ray of this.lightSource.rays) {
        if (!ray.active) continue;
        
        this.rays.push(ray);
        
        // 检查光线与光学元件的交互
        for (const element of this.opticalElements) {
          // 检查是否发生反射
          const reflectedRay = element.calculateReflection(ray);
          if (reflectedRay) {
            this.rays.push(reflectedRay);
            ray.active = false; // 原光线被反射后不再活跃
            break;
          }
          
          // 检查是否发生折射
          const refractedRay = element.calculateRefraction(ray, true);
          if (refractedRay) {
            this.rays.push(refractedRay);
            ray.active = false; // 原光线被折射后不再活跃
            break;
          }
        }
      }
    }
    
    // 更新指标
    let totalIntensity = 0;
    let detectedCount = 0;
    
    for (const sensor of this.sensors) {
      if (sensor.detected) {
        totalIntensity += sensor.intensity;
        detectedCount++;
      }
    }
    
    this.metrics.target_irradiance_pct = detectedCount > 0 ? (totalIntensity / detectedCount) * 100 : 0;
    this.metrics.focus_quality_score = this.calculateFocusQuality();
  }
  
  private calculateFocusQuality(): number {
    // 计算成像质量（简单实现）
    for (const screen of this.screens) {
      // 检查强度分布是否集中在中心
      let totalIntensity = 0;
      let centerIntensity = 0;
      
      for (let i = 0; i < screen.intensityMap.length; i++) {
        const intensity = screen.intensityMap[i];
        totalIntensity += intensity;
        
        // 中心区域（中间40%）
        if (i >= screen.intensityMap.length * 0.3 && i <= screen.intensityMap.length * 0.7) {
          centerIntensity += intensity;
        }
      }
      
      if (totalIntensity > 0) {
        return (centerIntensity / totalIntensity) * 100;
      }
    }
    
    return 0;
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
    
    // 绘制屏幕
    for (const screen of this.screens) {
      screen.render(ctx);
    }
    
    // 绘制光线
    for (const ray of this.rays) {
      ray.render(ctx);
    }
    
    // 绘制光学元件
    for (const element of this.opticalElements) {
      element.render(ctx);
    }
    
    // 绘制传感器
    for (const sensor of this.sensors) {
      sensor.render(ctx);
    }
    
    // 绘制光源
    if (this.lightSource) {
      this.lightSource.render(ctx);
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
    gradient.addColorStop(0, '#1a202c');
    gradient.addColorStop(1, '#2d3748');
    
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
  
  private drawControlPanel() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 控制面板背景
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(10, 10, 350, 150);
    ctx.strokeStyle = 'rgba(74, 108, 245, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, 350, 150);
    
    // 标题
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Orbitron, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('光学实验室控制台', 20, 35);
    
    // 当前关卡
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(`当前关卡: ${this.currentLevel}`, 20, 60);
    
    // 关卡描述
    let levelDesc = '';
    switch (this.currentLevel) {
      case 1:
        levelDesc = 'L1: 平面镜反射入门';
        break;
      case 2:
        levelDesc = 'L2: 凸透镜聚焦';
        break;
      case 3:
        levelDesc = 'L3: 全反射引导';
        break;
      default:
        levelDesc = `L${this.currentLevel}: 自定义`;
    }
    
    ctx.fillText(levelDesc, 20, 80);
    
    // 指标显示
    ctx.fillText(`目标辐照度: ${this.metrics.target_irradiance_pct?.toFixed(1)}%`, 20, 100);
    ctx.fillText(`成像质量: ${this.metrics.focus_quality_score?.toFixed(1)}%`, 20, 120);
  }
}

// 初始化函数
export async function init(options: SimInitOptions): Promise<SimController> {
  const opticsLab = new OpticsLab(options);
  return opticsLab;
}