let currentStep = 1;
let keyExpression = '';
let essayTopic = '';
let essayDifficulty = {
    province: '',
    examType: '',
    wordCount: ''
};

function nextStep(step) {
    // 保存当前步骤数据
    if (step === 1) {
        keyExpression = document.getElementById('keyExpression').value;
    } else if (step === 2) {
        essayTopic = document.getElementById('essayTopic').value;
    }
    
    // 隐藏当前步骤，显示下一步
    document.getElementById(`step${step}`).style.display = 'none';
    document.getElementById(`step${step+1}`).style.display = 'block';
    currentStep = step+1;
}

async function generateEssay() {
    // 保存难度设置
    essayDifficulty.province = document.getElementById('province').value;
    essayDifficulty.examType = document.getElementById('examType').value;
    essayDifficulty.wordCount = document.getElementById('wordCount').value;
    
    // 显示加载状态
    document.getElementById('step3').style.display = 'none';
    const resultsDiv = document.getElementById('results');
    resultsDiv.style.display = 'block';
    document.getElementById('essayOutput').innerHTML = '<p>正在生成范文，请稍候...</p>';
    
    try {
        const essays = await generateSampleEssays();
        displayEssays(essays);
    } catch (error) {
        console.error('生成范文过程中出错:', error);
        document.getElementById('essayOutput').innerHTML = `<p>生成范文失败: ${error.message}</p>`;
    }
}

async function generateSampleEssays() {
    const essays = [];
    
    for (let i = 1; i <= 3; i++) {
        try {
            const essayContent = await callDeepSeekAPI(i);
            essays.push(`
                <div class="essay">
                    <h3>范文 ${i}</h3>
                    <p>主题: ${essayTopic}</p>
                    <p>包含的关键表达: ${keyExpression}</p>
                    <p>难度设置: ${essayDifficulty.province} | ${essayDifficulty.examType} | ${essayDifficulty.wordCount}字</p>
                    <p>${essayContent}</p>
                </div>
            `);
        } catch (error) {
            console.error('生成范文出错:', error);
            essays.push(`
                <div class="essay">
                    <h3>范文 ${i} (生成失败)</h3>
                    <p>错误: ${error.message}</p>
                </div>
            `);
        }
    }
    
    return essays;
}

async function callDeepSeekAPI(index) {
    const API_KEY = 'sk-5705c379b802427c98c215a3ca4ed46d';
    const API_URL = 'https://api.deepseek.com/v1/chat/completions';
    
    // 精确的字数要求提示（允许±5个词的误差）
    const targetWordCount = parseInt(essayDifficulty.wordCount) || 100;
    const minWords = Math.max(targetWordCount - 5, 10);
    const maxWords = targetWordCount + 5;
    
    const prompt = `请严格按照以下要求生成一篇英语作文：
主题：${essayTopic}
必须包含的关键表达：${keyExpression}
字数要求：${targetWordCount}个单词（请确保作文字数在${minWords}-${maxWords}个单词之间）
难度要求：
- 省市：${essayDifficulty.province}
- 考试类型：${essayDifficulty.examType}

请确保作文内容自然流畅，合理使用给定的关键表达。`;
    
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
                { role: "system", content: "你是一位英语写作专家，正在生成一篇英语范文。请确保作文字数严格符合用户要求。" },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1000
        })
    });
    
    if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const essayContent = data.choices[0].message.content;
    
    // 精确统计单词数量（不包括标点符号和空格）
    const wordMatches = essayContent.match(/\b\w+\b/g);
    const actualWordCount = wordMatches ? wordMatches.length : 0;
    
    // 添加中文备注
    return `${essayContent}\n\n备注：作文字数统计：${actualWordCount}个单词（要求：${targetWordCount}字，允许±5个单词误差）`;
}

function displayEssays(essays) {
    const outputDiv = document.getElementById('essayOutput');
    outputDiv.innerHTML = '';
    
    essays.forEach(essay => {
        outputDiv.innerHTML += essay;
    });
}

function resetApp() {
    // 重置所有变量
    keyExpression = '';
    essayTopic = '';
    essayDifficulty = {
        province: '',
        examType: '',
        wordCount: ''
    };
    
    // 重置输入字段
    document.getElementById('keyExpression').value = '';
    document.getElementById('essayTopic').value = '';
    document.getElementById('province').value = '';
    document.getElementById('examType').value = '';
    document.getElementById('wordCount').value = '';
    
    // 显示第一步
    document.getElementById('results').style.display = 'none';
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
    currentStep = 1;
}