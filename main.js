// 主题切换
const themeToggle = document.querySelector('.theme-toggle');
themeToggle.addEventListener('click', () => {
    document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
});

// 轮播图功能
class Carousel {
    constructor() {
        this.currentSlide = 0;
        this.slides = document.querySelectorAll('.carousel-slide');
        this.dots = document.querySelector('.carousel-dots');
        this.isAnimating = false;
        this.preloadImages();
        this.updateSlides();
        this.setupDots();
        this.setupNavigation();
        this.startAutoPlay();
        this.setupTouchEvents();
    }

    preloadImages() {
        const images = Array.from(document.querySelectorAll('.carousel-slide img'));
        images.forEach(img => {
            const src = img.getAttribute('src');
            if (src) {
                const newImg = new Image();
                newImg.src = src;
            }
        });
    }

    setupDots() {
        this.slides.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('carousel-dot');
            dot.addEventListener('click', () => this.goToSlide(index));
            this.dots.appendChild(dot);
        });
    }

    setupNavigation() {
        document.querySelector('.prev').addEventListener('click', () => this.prevSlide());
        document.querySelector('.next').addEventListener('click', () => this.nextSlide());
    }

    goToSlide(index) {
        this.currentSlide = index;
        this.updateCarousel();
    }

    updateSlides() {
        this.slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === this.currentSlide);
        });
    }

    updateCarousel() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.updateSlides();
        
        document.querySelectorAll('.carousel-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 500);
    }

    startAutoPlay() {
        setInterval(() => {
            if (!this.isAnimating) {
                this.nextSlide();
            }
        }, 5000);
    }

    prevSlide() {
        if (this.isAnimating) return;
        this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.updateCarousel();
    }

    nextSlide() {
        if (this.isAnimating) return;
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
        this.updateCarousel();
    }

    setupTouchEvents() {
        let startX = 0;
        let isDragging = false;

        document.querySelector('.carousel').addEventListener('touchstart', (e) => {
            if (this.isAnimating) return;
            startX = e.touches[0].clientX;
            isDragging = true;
        });

        document.querySelector('.carousel').addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            if (this.isAnimating) return;
            const currentX = e.touches[0].clientX;
            const diff = startX - currentX;

            if (Math.abs(diff) > 50) {
                if (diff > 0) this.nextSlide();
                else this.prevSlide();
                isDragging = false;
            }
        });
    }
}

// AI聊天功能
class ChatInterface {
    constructor() {
        this.chatHistory = document.querySelector('.chat-history');
        this.input = document.querySelector('.chat-input textarea');
        this.sendButton = document.querySelector('.send-btn');
        this.voiceButton = document.querySelector('.voice-btn');
        this.uploadButton = document.querySelector('.upload-btn');
        this.fileInput = document.querySelector('#file-upload');
        this.API_KEY = 'sk-23310a07336f4bd5a3ac9dee0ec70bbd';
        this.API_URL = 'https://api.deepseek.com/chat/completions';
        
        this.recognition = null;
        this.isRecording = false;
        
        this.setupSpeechRecognition();
        this.setupEventListeners();
    }

    setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'zh-CN';

            this.recognition.onresult = (event) => {
                const text = event.results[0][0].transcript;
                this.input.value = text;
                this.stopRecording();
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopRecording();
            };
        }
    }

    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.voiceButton.addEventListener('click', () => this.toggleRecording());
        this.uploadButton.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    toggleRecording() {
        if (!this.recognition) {
            alert('您的浏览器不支持语音识别功能');
            return;
        }

        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    startRecording() {
        this.isRecording = true;
        this.voiceButton.classList.add('recording');
        this.recognition.start();
    }

    stopRecording() {
        this.isRecording = false;
        this.voiceButton.classList.remove('recording');
        this.recognition.stop();
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await this.readFileContent(file);
            this.input.value = text;
        } catch (error) {
            console.error('Error reading file:', error);
            alert('文件读取失败');
        }
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    async sendToDeepseek(message) {
        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.API_KEY}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: '你是一个友好的AI助手，能够用中文回答各种问题。'
                        },
                        {
                            role: 'user',
                            content: message
                        }
                    ],
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content || '抱歉，我现在无法回答这个问题。';
        } catch (error) {
            console.error('Error:', error);
            return '抱歉，发生了一些错误，请稍后再试。';
        }
    }

    async sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;

        this.addMessage(message, 'user');
        this.input.value = '';
        
        const loadingDiv = document.createElement('div');
        loadingDiv.classList.add('chat-message', 'ai-message', 'loading');
        loadingDiv.innerHTML = '<div class="message-content">正在思考...</div>';
        this.chatHistory.appendChild(loadingDiv);
        this.chatHistory.scrollTop = this.chatHistory.scrollHeight;

        const response = await this.sendToDeepseek(message);
        loadingDiv.remove();
        this.addMessage(response, 'ai');
    }

    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', `${type}-message`);
        
        const avatar = document.createElement('img');
        avatar.classList.add('avatar');
        avatar.src = type === 'user' ? 'logo.png' : 'deepseek.png';
        avatar.alt = type === 'user' ? 'User' : 'AI';

        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        messageContent.innerHTML = `<div class="message-text">${content}</div>`;

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        this.chatHistory.appendChild(messageDiv);
        this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
    }
}

// 技能数据
const skillsData = [
    {
        name: "Web开发",
        level: 90,
        description: "精通HTML5, CSS3, JavaScript等前端技术，熟练使用现代前端框架"
    },
    {
        name: "人工智能",
        level: 85,
        description: "深度学习和机器学习领域的实践经验，熟悉主流AI框架"
    },
    {
        name: "后端开发",
        level: 88,
        description: "熟练掌握Node.js, Python等后端技术，具备完整的系统设计能力"
    },
    {
        name: "数据库",
        level: 85,
        description: "精通SQL和NoSQL数据库，具备数据建模和优化经验"
    }
];

// 生成技能卡片
function generateSkillCards() {
    const container = document.querySelector('.skills-container');
    skillsData.forEach(skill => {
        const card = document.createElement('div');
        card.classList.add('skill-card');
        card.innerHTML = `
            <h3>${skill.name}</h3>
            <div class="skill-level">
                <div class="skill-progress" style="width: ${skill.level}%"></div>
            </div>
            <p>${skill.description}</p>
        `;
        container.appendChild(card);
    });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new Carousel();
    new ChatInterface();
    generateSkillCards();
    hljs.highlightAll(); // 代码高亮
}); 