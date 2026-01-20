let quizData = {};
let quiz2Data = {};
let currentQuizSet = 'quiz1'; // Track which quiz set is being used
let currentSection = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let timerInterval = null;
let timeRemaining = 300;
let timerDuration = 300;

// Load quiz data from JSON files
async function loadQuizData() {
    try {
        const response1 = await fetch('quizData.json');
        quizData = await response1.json();
        
        const response2 = await fetch('quizData2.json');
        quiz2Data = await response2.json();
    } catch (error) {
        console.error('Error loading quiz data:', error);
    }
}

// Get current quiz data based on selected quiz set
function getCurrentQuizData() {
    return currentQuizSet === 'quiz1' ? quizData : quiz2Data;
}

// Load settings from localStorage
function loadSettings() {
    const savedDuration = localStorage.getItem('timerDuration');
    if (savedDuration) {
        timerDuration = parseInt(savedDuration);
        timeRemaining = timerDuration;
    } else {
        timerDuration = 300;
        timeRemaining = 300;
    }
    document.getElementById('timerMinutes').value = timerDuration / 60;
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', async () => {
    await loadQuizData();
    loadSettings();
    initializeEventListeners();
});

function initializeEventListeners() {
    // Settings modal controls
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const cancelSettings = document.getElementById('cancelSettings');
    const saveSettings = document.getElementById('saveSettings');

    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });

    closeSettings.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    cancelSettings.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
        document.getElementById('timerMinutes').value = timerDuration / 60;
    });

    saveSettings.addEventListener('click', () => {
        const minutes = parseInt(document.getElementById('timerMinutes').value);
        if (minutes >= 1 && minutes <= 60) {
            timerDuration = minutes * 60;
            timeRemaining = timerDuration;
            localStorage.setItem('timerDuration', timerDuration);

            const timerEl = document.getElementById('timer');
            const displayMinutes = Math.floor(timeRemaining / 60);
            const displaySeconds = timeRemaining % 60;
            timerEl.textContent = `${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;

            settingsModal.classList.add('hidden');

            setTimeout(() => {
                alert('Settings saved! Timer set to ' + minutes + ' minute(s).');
            }, 100);
        } else {
            alert('Please enter a valid duration between 1 and 60 minutes.');
        }
    });

    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.add('hidden');
        }
    });

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';

    themeToggle.addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme');
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    });

    // Section selection
    document.querySelectorAll('.section-card').forEach(card => {
        card.addEventListener('click', () => {
            const section = card.dataset.section;
            startQuiz(section);
        });
    });

    // Quiz set selection
    document.querySelectorAll('.quiz-set-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            document.querySelectorAll('.quiz-set-btn').forEach(b => {
                b.classList.remove('active');
                if (b.classList.contains('btn')) {
                    b.classList.add('btn-secondary');
                }
            });
            btn.classList.add('active');
            btn.classList.remove('btn-secondary');
            
            // Update current quiz set
            currentQuizSet = btn.dataset.quiz;
        });
    });

    // Navigation buttons
    document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayQuestion();
        }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        if (currentQuestionIndex < currentQuestions.length - 1) {
            currentQuestionIndex++;
            displayQuestion();
        } else {
            finishQuiz();
        }
    });
}

// Shuffle array function
function shuffle(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function startQuiz(section) {
    currentSection = section;
    const data = getCurrentQuizData();

    if (section === 'personality') {
        currentQuestions = shuffle([...data.personalityAssessment]);
    } else if (section === 'numerical') {
        currentQuestions = shuffle([...data.mathQuestions]);
    } else if (section === 'verbal') {
        currentQuestions = shuffle([...data.verbalReasoningQuestions]);
    } else if (section === 'abstract') {
        currentQuestions = shuffle([...data.patternSequenceQuestions]);
    }

    userAnswers = new Array(currentQuestions.length).fill(null);
    currentQuestionIndex = 0;
    timeRemaining = timerDuration;

    document.getElementById('sectionSelection').classList.add('hidden');
    document.getElementById('quizContainer').classList.remove('hidden');
    document.getElementById('timerDisplay').classList.remove('hidden');

    startTimer();
    displayQuestion();
}

function startTimer() {
    const timerEl = document.getElementById('timer');

    timerInterval = setInterval(() => {
        timeRemaining--;

        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (timeRemaining === 300) {
            timerEl.classList.add('warning');
        }

        if (timeRemaining === 60) {
            timerEl.classList.remove('warning');
            timerEl.classList.add('danger');
        }

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            finishQuiz();
        }
    }, 1000);
}

function displayQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    const container = document.getElementById('questionContainer');
    const isPersonality = currentSection === 'personality';

    let html = `
        <div class="question-card">
            <div class="question-number">Question ${currentQuestionIndex + 1} of ${currentQuestions.length}</div>
            <div class="question-text">${question.questionText || question.pattern || question.passage}</div>
            <div class="${isPersonality ? 'scale-options options' : 'options'}">
    `;

    if (isPersonality) {
        const scales = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
        scales.forEach((label, index) => {
            const value = index + 1;
            const selected = userAnswers[currentQuestionIndex] === value ? 'selected' : '';
            html += `
                <div class="option scale-option ${selected}" data-value="${value}">
                    <div class="option-label">${value}</div>
                    <div>${label}</div>
                </div>
            `;
        });
    } else {
        Object.entries(question.options).forEach(([key, value]) => {
            const selected = userAnswers[currentQuestionIndex] === key ? 'selected' : '';
            html += `
                <div class="option ${selected}" data-answer="${key}">
                    <div class="option-label">${key}</div>
                    <div>${value}</div>
                </div>
            `;
        });
    }

    html += `</div></div>`;
    container.innerHTML = html;

    document.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');

            if (isPersonality) {
                userAnswers[currentQuestionIndex] = parseInt(option.dataset.value);
            } else {
                userAnswers[currentQuestionIndex] = option.dataset.answer;
            }
        });
    });

    const progress = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;

    updateNavigation();
}

function updateNavigation() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    prevBtn.disabled = currentQuestionIndex === 0;

    if (currentQuestionIndex === currentQuestions.length - 1) {
        nextBtn.textContent = 'Finish';
    } else {
        nextBtn.textContent = 'Next';
    }
}

function finishQuiz() {
    clearInterval(timerInterval);

    document.getElementById('quizContainer').classList.add('hidden');
    document.getElementById('timerDisplay').classList.add('hidden');

    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.classList.remove('hidden');

    const timeTaken = timerDuration - timeRemaining;
    const minutesTaken = Math.floor(timeTaken / 60);
    const secondsTaken = timeTaken % 60;

    let html = '<div class="results"><h2>Quiz Results</h2>';

    if (currentSection === 'personality') {
        html += generatePersonalityResults();
    } else {
        html += generateStandardResults();
    }

    html += `
        <div style="margin-top: 2rem; text-align: center;">
            <p><strong>Time taken:</strong> ${minutesTaken}m ${secondsTaken}s</p>
            <button class="btn" onclick="location.reload()">Take Another Quiz</button>
        </div>
    </div>`;

    resultsContainer.innerHTML = html;
}

function generateStandardResults() {
    let correct = 0;
    const totalQuestions = currentQuestions.length;
    const timeTaken = timerDuration - timeRemaining;

    currentQuestions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const correctAnswer = question.correctAnswer;
        if (userAnswer === correctAnswer) correct++;
    });

    const percentage = Math.round((correct / totalQuestions) * 100);
    const powerScore = (correct / (timeTaken / 60)).toFixed(2);

    let performanceLevel, performanceColor;
    if (correct >= 13) {
        performanceLevel = 'High Score';
        performanceColor = '#28a745';
    } else if (correct >= 9) {
        performanceLevel = 'Medium Score';
        performanceColor = '#ffc107';
    } else {
        performanceLevel = 'Low Score';
        performanceColor = '#dc3545';
    }

    const interpretations = {
        numerical: {
            high: 'Strong quantitative skills; high comfort level with data and mental arithmetic.',
            medium: 'Good foundational math, but may need more time or scratch paper for complex problems.',
            low: 'May struggle with data-heavy tasks or quick decision-making involving numbers.'
        },
        verbal: {
            high: 'Excellent comprehension, logic, and attention to detail in communication.',
            medium: 'Solid understanding, but might fall for "logic traps" (like the "Cannot Say" questions).',
            low: 'May struggle with complex instructions or deductive reasoning.'
        },
        abstract: {
            high: 'Exceptional lateral thinking; can see the "big picture" and spot trends quickly.',
            medium: 'Good at following established rules but may take longer to identify new, complex patterns.',
            low: 'Prefers clear, explicit instructions over figuring out systems from scratch.'
        }
    };

    const levelKey = correct >= 13 ? 'high' : correct >= 9 ? 'medium' : 'low';
    const performanceDescription = interpretations[currentSection][levelKey];

    const passStatus = percentage >= 70 ? 'Pass ✓' : 'Review Needed';
    const passColor = percentage >= 70 ? '#28a745' : '#dc3545';

    let html = `
        <div class="result-section">
            <h3>📊 ${currentSection === 'numerical' ? 'Numerical' : currentSection === 'verbal' ? 'Verbal' : 'Abstract'} Reasoning Results</h3>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 2rem 0;">
                <div style="background: var(--bg-primary); padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid ${performanceColor};">
                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Raw Score</div>
                    <div style="font-size: 2.5rem; font-weight: bold; color: ${performanceColor};">${correct}/${totalQuestions}</div>
                </div>
                
                <div style="background: var(--bg-primary); padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid var(--accent-color);">
                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Accuracy</div>
                    <div style="font-size: 2.5rem; font-weight: bold; color: var(--accent-color);">${percentage}%</div>
                </div>
                
                <div style="background: var(--bg-primary); padding: 1.5rem; border-radius: 8px; text-align: center; border: 2px solid ${passColor};">
                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Status</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: ${passColor};">${passStatus}</div>
                </div>
            </div>
            
            <div style="background: var(--bg-primary); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid ${performanceColor};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
                    <h4 style="margin: 0;">Performance Level</h4>
                    <span style="background: ${performanceColor}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: bold;">
                        ${performanceLevel}
                    </span>
                </div>
                <p style="color: var(--text-secondary); margin: 0;">${performanceDescription}</p>
            </div>
            
            <div style="background: var(--bg-primary); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <h4 style="margin-bottom: 1rem;">⚡ Efficiency Metrics</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                    <div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Time Taken</div>
                        <div style="font-size: 1.3rem; font-weight: bold;">${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s</div>
                    </div>
                    <div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Avg. Time per Question</div>
                        <div style="font-size: 1.3rem; font-weight: bold;">${Math.round(timeTaken / totalQuestions)}s</div>
                    </div>
                    <div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Power Score</div>
                        <div style="font-size: 1.3rem; font-weight: bold;">${powerScore}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">Correct/minute</div>
                    </div>
                </div>
            </div>
            
            <h4 style="margin: 1.5rem 0 1rem 0;">📝 Question Review</h4>
    `;

    currentQuestions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const correctAnswer = question.correctAnswer;
        const isCorrect = userAnswer === correctAnswer;

        html += `
            <div class="feedback-item ${isCorrect ? 'correct' : 'incorrect'}">
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem; margin-bottom: 0.5rem;">
                        <strong>Q${index + 1}:</strong>
                        <span style="font-size: 1.5rem;">${isCorrect ? '✓' : '✗'}</span>
                    </div>
                    <div style="margin-bottom: 0.5rem;">${question.questionText || question.pattern || question.passage}</div>
                    <div style="font-size: 0.9rem;">
                        <strong>Your answer:</strong> ${userAnswer || 'Not answered'} ${userAnswer && question.options ? '→ ' + question.options[userAnswer] : ''}
                        ${!isCorrect ? `<br><strong style="color: var(--success-color);">Correct answer:</strong> ${correctAnswer} → ${question.options[correctAnswer]}` : ''}
                        ${question.explanation ? `<br><br><strong>Explanation:</strong> <span style="color: var(--text-secondary);">${question.explanation}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    return html;
}

function generatePersonalityResults() {
    const answered = userAnswers.filter(a => a !== null).length;

    // Initialize scores for each trait
    const scores = {
        extraversion: { total: 0, count: 0, questions: [] },
        conscientiousness: { total: 0, count: 0, questions: [] },
        emotionalStability: { total: 0, count: 0, questions: [] },
        openness: { total: 0, count: 0, questions: [] },
        agreeableness: { total: 0, count: 0, questions: [] }
    };

    // Calculate scores based on trait assignments in questions
    currentQuestions.forEach((question, index) => {
        const answer = userAnswers[index];
        if (answer && question.trait) {
            const trait = question.trait;
            const isReversed = question.reverseScored === true;
            const score = isReversed ? (6 - answer) : answer;
            
            scores[trait].total += score;
            scores[trait].count += 1;
            scores[trait].questions.push(index + 1);
        }
    });

    // If questions don't have trait assignments, fall back to original mapping
    if (scores.extraversion.count === 0) {
        scores.extraversion = {
            total: (userAnswers[0] || 0) + (userAnswers[5] || 0) + (userAnswers[9] || 0),
            count: 3,
            questions: [1, 6, 10]
        };
        scores.conscientiousness = {
            total: (userAnswers[1] || 0) + (userAnswers[4] || 0) + (userAnswers[6] || 0) + (userAnswers[13] || 0),
            count: 4,
            questions: [2, 5, 7, 14]
        };
        scores.emotionalStability = {
            total: (userAnswers[2] || 0) + (userAnswers[10] ? (6 - userAnswers[10]) : 0),
            count: 2,
            questions: [3, 11]
        };
        scores.openness = {
            total: (userAnswers[3] || 0) + (userAnswers[7] || 0) + (userAnswers[11] || 0) + (userAnswers[14] || 0),
            count: 4,
            questions: [4, 8, 12, 15]
        };
        scores.agreeableness = {
            total: (userAnswers[12] || 0),
            count: 1,
            questions: [13]
        };
    }

    Object.keys(scores).forEach(trait => {
        if (scores[trait].count > 0) {
            scores[trait].average = scores[trait].total / scores[trait].count;
        } else {
            scores[trait].average = 0;
        }
    });

    function getTraitLevel(average) {
        if (average >= 4.5) return { label: 'Very High', color: '#28a745' };
        if (average >= 3.5) return { label: 'High', color: '#20c997' };
        if (average >= 2.5) return { label: 'Moderate', color: '#ffc107' };
        if (average >= 1.5) return { label: 'Low', color: '#fd7e14' };
        return { label: 'Very Low', color: '#dc3545' };
    }

    function getTraitDescription(trait, level) {
        const descriptions = {
            extraversion: {
                'Very High': 'You are highly outgoing, sociable, and energized by social interactions.',
                'High': 'You enjoy social situations and feel comfortable in group settings.',
                'Moderate': 'You balance social interaction with alone time.',
                'Low': 'You prefer smaller groups and quieter environments.',
                'Very Low': 'You are more introverted and prefer solitude or one-on-one interactions.'
            },
            conscientiousness: {
                'Very High': 'You are extremely organized, detail-oriented, and disciplined.',
                'High': 'You are well-organized and take your responsibilities seriously.',
                'Moderate': 'You balance planning with flexibility.',
                'Low': 'You prefer spontaneity and may be less focused on details.',
                'Very Low': 'You are very spontaneous and less concerned with organization.'
            },
            emotionalStability: {
                'Very High': 'You remain exceptionally calm and composed under pressure.',
                'High': 'You handle stress well and maintain emotional balance.',
                'Moderate': 'You experience normal levels of stress and anxiety.',
                'Low': 'You may experience higher levels of worry or stress.',
                'Very Low': 'You tend to experience significant anxiety or emotional reactions.'
            },
            openness: {
                'Very High': 'You are highly creative, curious, and love new experiences.',
                'High': 'You enjoy trying new things and thinking abstractly.',
                'Moderate': 'You balance familiarity with new experiences.',
                'Low': 'You prefer familiar routines and practical approaches.',
                'Very Low': 'You strongly prefer routine and conventional methods.'
            },
            agreeableness: {
                'Very High': 'You are extremely cooperative and prioritize group harmony.',
                'High': 'You are cooperative and considerate of others.',
                'Moderate': 'You balance personal and group interests.',
                'Low': 'You may prioritize your own interests more often.',
                'Very Low': 'You tend to be more competitive and self-focused.'
            }
        };
        return descriptions[trait][level];
    }

    let html = `
        <div class="result-section">
            <h3>🧠 Your Personality Profile</h3>
            <p style="margin-bottom: 2rem;">You answered ${answered} out of ${currentQuestions.length} questions. Here's your Big Five personality trait analysis:</p>
    `;

    const traitNames = {
        extraversion: '👥 Extraversion',
        conscientiousness: '📋 Conscientiousness',
        emotionalStability: '😌 Emotional Stability',
        openness: '🎨 Openness to Experience',
        agreeableness: '🤝 Agreeableness'
    };

    Object.entries(scores).forEach(([trait, data]) => {
        const level = getTraitLevel(data.average);
        const description = getTraitDescription(trait, level.label);
        const percentage = (data.average / 5) * 100;

        html += `
            <div style="margin-bottom: 2rem; padding: 1.5rem; background: var(--bg-primary); border-radius: 8px; border-left: 4px solid ${level.color};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
                    <h4 style="margin: 0;">${traitNames[trait]}</h4>
                    <span style="background: ${level.color}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: bold;">
                        ${level.label}
                    </span>
                </div>
                <div style="background: var(--bg-secondary); height: 12px; border-radius: 6px; overflow: hidden; margin: 0.75rem 0;">
                    <div style="background: ${level.color}; height: 100%; width: ${percentage}%; transition: width 0.5s;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.75rem;">
                    <span><strong>Score:</strong> ${data.average.toFixed(2)} / 5.00</span>
                    <span><strong>Total:</strong> ${data.total} / ${data.count * 5}</span>
                </div>
                <p style="color: var(--text-secondary); font-size: 0.95rem; margin: 0;">${description}</p>
                <details style="margin-top: 0.75rem;">
                    <summary style="cursor: pointer; color: var(--accent-color); font-size: 0.9rem;">Based on questions: ${data.questions.join(', ')}</summary>
                </details>
            </div>
        `;
    });

    html += `
        </div>
        <div class="result-section">
            <h3>📊 Detailed Responses</h3>
            <div style="margin-top: 1rem;">
    `;

    const labels = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

    currentQuestions.forEach((question, index) => {
        const answer = userAnswers[index];
        const isReversed = question.reverseScored === true;
        const displayAnswer = answer ? labels[answer - 1] + ' (' + answer + ')' : 'Not answered';

        html += `
            <div class="feedback-item" style="background: var(--bg-primary); border-left: 4px solid var(--accent-color);">
                <div>
                    <strong>Q${index + 1}:</strong> ${question.questionText}
                    ${isReversed ? '<span style="color: var(--accent-color); font-size: 0.85rem;"> (Reverse scored)</span>' : ''}
                    ${question.trait ? '<span style="color: var(--text-secondary); font-size: 0.85rem;"> [' + question.trait + ']</span>' : ''}<br>
                    <small>Response: ${displayAnswer}</small>
                </div>
            </div>
        `;
    });

    html += '</div></div>';
    return html;
}