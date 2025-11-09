// 平滑滚动功能
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// 导航栏滚动效果
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.padding = '10px 0';
        navbar.style.background = 'rgba(11, 17, 32, 0.98)';
    } else {
        navbar.style.padding = '20px 0';
        navbar.style.background = 'rgba(11, 17, 32, 0.95)';
    }
});

// 模块卡片悬停效果增强
document.querySelectorAll('.module-card, .feature-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// 动态背景粒子效果
document.addEventListener('DOMContentLoaded', function() {
    // 创建粒子背景效果
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        // 创建粒子容器
        const particleContainer = document.createElement('div');
        particleContainer.className = 'particles';
        heroSection.appendChild(particleContainer);
        
        // 创建粒子
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.width = Math.random() * 5 + 2 + 'px';
            particle.style.height = particle.style.width;
            particle.style.animationDuration = (Math.random() * 10 + 5) + 's';
            particleContainer.appendChild(particle);
        }
    }
    
    // 添加视差滚动效果
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector('.hero');
        const speed = scrolled * 0.5;
        
        if (parallax) {
            parallax.style.backgroundPositionY = speed + 'px';
        }
    });
    
    // 按钮点击效果
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            // 创建波纹效果
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            this.appendChild(ripple);
            
            // 移除波纹元素
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});

// 响应式导航菜单切换
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

// 添加到页面的适当位置
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否需要添加移动端菜单按钮
    if (window.innerWidth <= 768) {
        const menuButton = document.createElement('button');
        menuButton.className = 'menu-toggle';
        menuButton.innerHTML = '☰';
        menuButton.addEventListener('click', toggleMobileMenu);
        
        const navbarContainer = document.querySelector('.navbar .container');
        if (navbarContainer) {
            navbarContainer.insertBefore(menuButton, navbarContainer.firstChild);
        }
    }
});

// 表单验证和提交处理（如果有表单）
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    // 这里可以添加具体的表单验证逻辑
    // 例如邮箱验证、必填字段检查等
    return true;
}

// 动画观察器 - 当元素进入视口时触发动画
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animated');
        }
    });
}, observerOptions);

// 观察需要动画的元素
document.addEventListener('DOMContentLoaded', function() {
    const animateElements = document.querySelectorAll('.feature-card, .module-card, .pricing-card');
    animateElements.forEach(el => {
        observer.observe(el);
    });
});

// 添加到页面的动态内容
document.addEventListener('DOMContentLoaded', function() {
    // 添加粒子样式到页面
    const style = document.createElement('style');
    style.textContent = `
        .particles {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            overflow: hidden;
        }
        
        .particle {
            position: absolute;
            background: rgba(74, 108, 245, 0.5);
            border-radius: 50%;
            pointer-events: none;
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
            0% { transform: translateY(0) translateX(0); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
        }
        
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.7);
            transform: scale(0);
            animation: ripple 0.6s linear;
        }
        
        @keyframes ripple {
            to {
                transform: scale(2.5);
                opacity: 0;
            }
        }
        
        .animated {
            animation: fadeInUp 0.6s ease-out forwards;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
});