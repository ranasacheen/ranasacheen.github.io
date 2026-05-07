const quizData = [
    // PHYSICS
    { q: "If the velocity of a body is doubled, its kinetic energy becomes:", o: ["Double", "Half", "Four times", "One-fourth"], a: 2 },
    { q: "The working principle of a transformer is:", o: ["Self-induction", "Mutual induction", "Eddy currents", "Fleming’s Right Hand Rule"], a: 1 },
    { q: "Which color of light deviates the least in a prism?", o: ["Violet", "Blue", "Red", "Yellow"], a: 2 },
    { q: "The power of a lens is -2.0 D. Its focal length is:", o: ["50 cm", "-50 cm", "20 cm", "-20 cm"], a: 1 },
    { q: "In a circuit, three resistors of 3Ω each are connected in parallel. The equivalent resistance is:", o: ["9Ω", "1Ω", "0.33Ω", "6Ω"], a: 1 },
    { q: "Upthrust depends on:", o: ["Mass of the body", "Density of the liquid", "Shape of the body", "Depth of liquid"], a: 1 },
    { q: "The escape velocity of Earth is approximately:", o: ["9.8 km/s", "11.2 km/s", "7.9 km/s", "42 km/s"], a: 1 },
    { q: "Sound waves travel fastest in:", o: ["Vacuum", "Air", "Water", "Steel"], a: 3 },
    { q: "A fuse wire is made of an alloy of:", o: ["Tin and Lead", "Copper and Tin", "Lead and Zinc", "Copper and Aluminium"], a: 0 },
    { q: "One Horse Power (HP) is equal to:", o: ["746 W", "1000 W", "500 W", "764 W"], a: 0 },
    { q: "If the distance between two masses is doubled, the gravitational force becomes:", o: ["Double", "Half", "One-fourth", "Four times"], a: 2 },
    { q: "A concave lens always forms an image that is:", o: ["Real & Erect", "Virtual & Erect", "Real & Inverted", "Virtual & Inverted"], a: 1 },
    { q: "The unit of electrical energy consumed in a house is:", o: ["Watt", "Joule", "kWh", "Ampere"], a: 2 },
    { q: "Which of the following has the highest specific heat capacity?", o: ["Iron", "Water", "Mercury", "Alcohol"], a: 1 },
    { q: "Why does a pressure cooker cook food faster?", o: ["High pressure lowers B.P.", "High pressure raises B.P.", "Constant volume", "High density"], a: 1 },
    { q: "The image formed by a plane mirror is:", o: ["Real and erect", "Virtual and inverted", "Virtual and erect", "Real and inverted"], a: 2 },
    { q: "Resistance of a wire is inversely proportional to its:", o: ["Length", "Area of cross-section", "Temperature", "Nature of material"], a: 1 },
    { q: "The lens used to correct myopia is:", o: ["Convex", "Concave", "Cylindrical", "Bifocal"], a: 1 },
    { q: "1 calorie is equal to how many Joules?", o: ["4.2", "0.24", "4200", "1000"], a: 0 },
    { q: "The device used to measure current is:", o: ["Voltmeter", "Ammeter", "Galvanometer", "Potentiometer"], a: 1 },

    // CHEMISTRY
    { q: "Which element has the highest electronegativity?", o: ["Oxygen", "Fluorine", "Chlorine", "Nitrogen"], a: 1 },
    { q: "The functional group of alcohol is:", o: ["-CHO", "-COOH", "-OH", "-CO-"], a: 2 },
    { q: "Which gas is used in fire extinguishers?", o: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], a: 2 },
    { q: "The chemical formula of Plaster of Paris is:", o: ["CaSO4 · 2H2O", "CaSO4 · 1/2H2O", "Na2CO3", "CaOCl2"], a: 1 },
    { q: "Which of the following is a noble gas?", o: ["Nitrogen", "Argon", "Oxygen", "Chlorine"], a: 1 },
    { q: "The maximum number of electrons in the 'M' shell is:", o: ["8", "18", "32", "2"], a: 1 },
    { q: "Which type of bond is formed by the sharing of electrons?", o: ["Ionic", "Covalent", "Metallic", "Hydrogen"], a: 1 },
    { q: "A solution turns red litmus blue. Its pH is likely to be:", o: ["1", "4", "5", "10"], a: 3 },
    { q: "Hematite is an ore of:", o: ["Copper", "Iron", "Aluminium", "Silver"], a: 1 },
    { q: "2Mg + O2 → 2MgO is what type of reaction?", o: ["Decomposition", "Addition (Combination)", "Displacement", "Neutralization"], a: 1 },
    { q: "The hardest natural substance is:", o: ["Gold", "Iron", "Diamond", "Graphite"], a: 2 },
    { q: "Vinegar contains:", o: ["Acetic acid", "Citric acid", "Lactic acid", "Tartaric acid"], a: 0 },
    { q: "The gas used to fill electric bulbs is:", o: ["Helium", "Nitrogen", "Argon", "Both Nitrogen and Argon"], a: 3 },
    { q: "Which metal is kept in kerosene?", o: ["Sodium", "Magnesium", "Calcium", "Iron"], a: 0 },
    { q: "The process of rusting is an example of:", o: ["Reduction", "Oxidation", "Hydrogenation", "Substitution"], a: 1 },

    // BIOLOGY
    { q: "Which blood group is known as the 'Universal Donor'?", o: ["AB+", "O-", "A+", "B-"], a: 1 },
    { q: "The structural and functional unit of the kidney is:", o: ["Neuron", "Nephron", "Alveoli", "Villi"], a: 1 },
    { q: "Double fertilization is a characteristic of:", o: ["Algae", "Fungi", "Angiosperms", "Gymnosperms"], a: 2 },
    { q: "Which hormone is responsible for the 'Flight or Fight' response?", o: ["Insulin", "Adrenaline", "Thyroxine", "Estrogen"], a: 1 },
    { q: "The Vitamin that helps in blood clotting is:", o: ["Vit A", "Vit C", "Vit D", "Vit K"], a: 3 },
    { q: "The ratio of phenotypic traits in Mendel's monohybrid cross is:", o: ["3:1", "1:2:1", "9:3:3:1", "1:1"], a: 0 },
    { q: "Which gland is known as the 'Master Gland'?", o: ["Thyroid", "Adrenal", "Pituitary", "Pancreas"], a: 2 },
    { q: "The 'Amphibians of the plant kingdom' are:", o: ["Thallophyta", "Bryophyta", "Pteridophyta", "Gymnosperms"], a: 1 },
    { q: "The powerhouse of the cell is:", o: ["Nucleus", "Ribosome", "Mitochondria", "Golgi Body"], a: 2 },
    { q: "In a food chain, the energy flow is always:", o: ["Bidirectional", "Unidirectional", "Multidirectional", "Circular"], a: 1 },
    { q: "The site of protein synthesis is:", o: ["Lysosome", "Ribosome", "Mitochondria", "Vacuole"], a: 1 },
    { q: "Chromosomes are made up of:", o: ["DNA only", "Protein only", "DNA and Protein", "RNA only"], a: 2 },
    { q: "Deficiency of Iodine causes:", o: ["Scurvy", "Rickets", "Goitre", "Anemia"], a: 2 },
    { q: "The normal blood pressure of a human is:", o: ["120/80 mmHg", "140/90 mmHg", "100/70 mmHg", "80/120 mmHg"], a: 0 },

    // MATHEMATICS
    { q: "If 2^x = 32, find x.", o: ["4", "5", "6", "2"], a: 1 },
    { q: "The area of an equilateral triangle with side 4 cm is:", o: ["4√3", "8√3", "16√3", "2√3"], a: 0 },
    { q: "If tan θ = 1, then θ is:", o: ["30°", "45°", "60°", "90°"], a: 1 },
    { q: "The volume of a sphere of radius r is:", o: ["πr^2", "2πr^2", "4/3πr^3", "4πr^2"], a: 2 },
    { q: "The sum of the interior angles of a hexagon is:", o: ["360°", "540°", "720°", "900°"], a: 2 },
    { q: "Probability of a leap year having 53 Sundays is:", o: ["1/7", "2/7", "3/7", "53/366"], a: 1 },

    // ENGLISH & IQ
    { q: "Synonym of 'Diligent':", o: ["Lazy", "Hardworking", "Intelligent", "Famous"], a: 1 },
    { q: "Antonym of 'Ancient':", o: ["Old", "Modern", "Historic", "Primeval"], a: 1 },
    { q: "Choose the correct spelling:", o: ["Occured", "Occurred", "Ocurred", "Ocurrred"], a: 1 },
    { q: "I have been living here ___ 2010.", o: ["for", "since", "from", "in"], a: 1 },
    { q: "Passive Voice: 'She is singing a song.'", o: ["A song is being sung by her.", "A song was sung by her.", "A song sung by her.", "A song is singing by her."], a: 0 },
    { q: "IQ: 1, 4, 9, 16, 25, ?", o: ["30", "36", "49", "64"], a: 1 },
    { q: "IQ: Eye : See :: Ear : ?", o: ["Hear", "Sound", "Listen", "Noise"], a: 0 },
    { q: "IQ: Which number comes next? 2, 6, 12, 20, 30, ___?", o: ["36", "40", "42", "50"], a: 2 },
    { q: "IQ: Find the odd one out:", o: ["Kathmandu", "Thimphu", "Mumbai", "Dhaka"], a: 2 } // Mumbai is not a capital city.
];

let currentIdx = 0;
let score = 0;

const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const nextBtn = document.getElementById('next-btn');
const currentQNum = document.getElementById('current-q-num');
const liveScore = document.getElementById('live-score');
const resultsDiv = document.getElementById('results');

function loadQuestion() {
    resetState();
    currentQNum.innerText = currentIdx + 1;
    liveScore.innerText = score;

    let currentQ = quizData[currentIdx];
    questionText.innerText = currentQ.q;
    
    currentQ.o.forEach((option, index) => {
        const button = document.createElement('button');
        button.innerText = option;
        button.classList.add('btn');
        button.addEventListener('click', () => selectAnswer(index));
        optionsContainer.appendChild(button);
    });
}

function resetState() {
    nextBtn.classList.add('hide');
    while (optionsContainer.firstChild) {
        optionsContainer.removeChild(optionsContainer.firstChild);
    }
}

function selectAnswer(index) {
    const buttons = optionsContainer.querySelectorAll('.btn');
    const correct = quizData[currentIdx].a;
    
    buttons.forEach(btn => btn.style.pointerEvents = 'none');

    if (index === correct) {
        score++;
        buttons[index].classList.add('correct');
        liveScore.innerText = score;
    } else {
        buttons[index].classList.add('error');
        buttons[correct].classList.add('correct');
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
    document.getElementById('quiz-status').classList.add('hide');
    resultsDiv.classList.remove('hide');
    document.getElementById('final-score').innerText = `You scored ${score} out of ${quizData.length}`;
}

// Start the quiz
loadQuestion();
