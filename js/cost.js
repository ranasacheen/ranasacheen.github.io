// Array containing a sample of the 50 questions generated[cite: 1, 2]
const quizData = [
    {
        q: "Which cell type is responsible for the formation of a dentinal bridge after pulp capping with MTA?",
        o: ["Primary Odontoblasts", "Replacement Odontoblast-like cells", "Fibroblasts", "Macrophages"],
        a: 1 // Index of "Replacement Odontoblast-like cells"[cite: 2]
    },
    {
        q: "The 'danger zone' in mandibular molars, susceptible to strip perforation, is located:",
        o: ["Mesial surface", "Distal surface of distal root", "Distal surface of mesial root", "Furcation area"],
        a: 2 // Index of "Distal surface of mesial root"[cite: 2]
    }
    // Add the remaining 48 questions here using the same format
];

let currentIdx = 0;
let score = 0;

const qText = document.getElementById('question-text');
const oContainer = document.getElementById('options-container');
const nextBtn = document.getElementById('next-btn');
const resultsDiv = document.getElementById('results');

function loadQuestion() {
    resetState();
    let currentQ = quizData[currentIdx];
    qText.innerText = `${currentIdx + 1}. ${currentQ.q}`;
    
    currentQ.o.forEach((option, index) => {
        const button = document.createElement('button');
        button.innerText = option;
        button.classList.add('btn');
        button.addEventListener('click', () => selectAnswer(index));
        oContainer.appendChild(button);
    });
}

function resetState() {
    nextBtn.classList.add('hide');
    while (oContainer.firstChild) {
        oContainer.removeChild(oContainer.firstChild);
    }
}

function selectAnswer(index) {
    const correct = quizData[currentIdx].a;
    if (index === correct) {
        score++;
        alert("Correct!");
    } else {
        alert("Wrong Answer!");
    }
    nextBtn.classList.remove('hide');
}

nextBtn.addEventListener('click', () => {
    currentIdx++;
    if (currentIdx < quizData.length) {
        loadQuestion();
    } else {
        showResults();
    }
});

function showResults() {
    document.getElementById('question-container').classList.add('hide');
    resultsDiv.classList.remove('hide');
    document.getElementById('score-text').innerText = `You scored ${score} out of ${quizData.length}`;
}

loadQuestion();
