// Array containing a sample of the 50 questions generated[cite: 1, 2]
const quizData = [
    { q: "Which cell type is responsible for the formation of a dentinal bridge after pulp capping with MTA?", o: ["Primary Odontoblasts", "Replacement Odontoblast-like cells", "Fibroblasts", "Macrophages"], a: 1 },
    { q: "The 'danger zone' in mandibular molars, susceptible to strip perforation, is located:", o: ["Mesial surface of the mesial root", "Distal surface of the distal root", "Distal surface of the mesial root", "Furcation area of the distal root"], a: 2 },
    { q: "Which fiber type is primarily responsible for the 'throbbing' pain associated with irreversible pulpitis?", o: ["A-delta", "A-beta", "C-fibers", "Proprioceptors"], a: 2 },
    { q: "The most frequent cause of endodontic failure is:", o: ["Inadequate cleaning and shaping", "Poor coronal seal", "Systemic disease", "Overfilling"], a: 0 },
    { q: "According to Vertucci's classification, a 'Type II' canal configuration is:", o: ["1-1", "2-1", "1-2", "2-2"], a: 1 },
    { q: "Which irrigant has the ability to dissolve both organic and inorganic tissue?", o: ["NaOCl", "EDTA", "Chlorhexidine", "None of the above"], a: 3 }, // Note: NaOCl dissolves organic only; EDTA inorganic only.[cite: 2]
    { q: "The 'Law of Symmetry' (Krasner & Rankow) does NOT apply to which teeth?", o: ["Maxillary molars", "Mandibular molars", "Mandibular premolars", "Maxillary premolars"], a: 0 },
    { q: "What is the primary reason for 'recapitulation' during canal preparation?", o: ["To increase canal size", "To remove accumulated debris in the apical portion", "To smoothen walls", "To measure working length"], a: 1 },
    { q: "Internal resorption is typically initiated by:", o: ["Bacteria in the PDL", "Chronic pulpal inflammation", "Trauma to the cementum", "Systemic calcium deficiency"], a: 1 },
    { q: "The main advantage of NiTi files over stainless steel is:", o: ["Higher cutting efficiency", "Lower cost", "Super-elasticity and flexibility", "Better tactile sensation"], a: 2 },
    { q: "Sodium hypochlorite accidents are best managed initially by:", o: ["Immediate surgery", "Long-term antibiotics", "Palliative care: analgesics and cold compresses (early)", "Corticosteroids injection"], a: 2 },
    { q: "Which of the following has the highest success rate in vital pulp therapy for immature permanent teeth?", o: ["Calcium Hydroxide", "MTA", "Zinc Oxide Eugenol", "Formocresol"], a: 1 },
    { q: "The 'Phoenix Abscess' is also known as:", o: ["Acute apical periodontitis", "Recrudescent apical periodontitis", "Chronic apical periodontitis", "Condensing osteitis"], a: 1 },
    { q: "Which clinical test is most reliable for determining pulp vitality in a recently traumatized tooth?", o: ["EPT", "Cold test", "Laser Doppler Flowmetry", "Percussion"], a: 2 },
    { q: "The 'Standardized' ISO file taper is:", o: ["0.02", "0.04", "0.06", "0.10"], a: 0 },
    { q: "Which bacteria are most commonly associated with persistent/failed endodontic cases?", o: ["P. gingivalis", "E. faecalis", "S. mutans", "Actinomyces"], a: 1 },
    { q: "What is the pH of Calcium Hydroxide?", o: ["5.5", "7.0", "9.5", "12.5"], a: 3 },
    { q: "A tooth with a sinus tract is diagnosed as having:", o: ["Symptomatic apical periodontitis", "Asymptomatic apical periodontitis", "Chronic apical abscess", "Acute apical abscess"], a: 2 },
    { q: "The 'smear layer' is primarily removed by which agent?", o: ["5.25% NaOCl", "17% EDTA", "2% CHX", "Saline"], a: 1 },
    { q: "Which of the following is NOT a property of MTA?", o: ["Biocompatibility", "Radio-opacity", "Excellent seal", "Easy to remove from canal"], a: 3 },
    { q: "The most common direction of a root fracture in a non-vital tooth is:", o: ["Mesiodistal", "Buccolingual", "Oblique", "Horizontal"], a: 1 },
    { q: "Which of the following is a symptom of 'Symptomatic Irreversible Pulpitis'?", o: ["No pain to cold", "Lingering pain to cold (>15 sec)", "Pain only to percussion", "No response to EPT"], a: 1 },
    { q: "Endodontic-Periodontal lesions: Which usually has a better prognosis after treatment?", o: ["Primary perio with secondary endo", "Primary endo with secondary perio", "Combined lesion", "They are the same"], a: 1 },
    { q: "The 'balanced force' technique uses which type of file motion?", o: ["Continuous clockwise rotation", "90 deg CW then 120-270 deg CCW", "Vertical push-pull", "Reciprocal 360 deg"], a: 1 },
    { q: "What is the most likely cause of a radiolucency at the side of a root (not the apex)?", o: ["Lateral canal", "Horizontal fracture", "Vertical fracture", "All of the above"], a: 3 },
    { q: "Internal resorption: What is the radiographic appearance?", o: ["Symmetrical enlargement of canal", "Shifting of canal with angulation", "Moth-eaten appearance of bone", "Narrowing of canal"], a: 0 },
    { q: "Which condition is characterized by the replacement of PDL with bone?", o: ["Replacement resorption (ankylosis)", "Cervical resorption", "Internal resorption", "Surface resorption"], a: 0 },
    { q: "The concentration of CHX used in endodontics is typically:", o: ["0.12%", "2.0%", "5.0%", "10%"], a: 1 },
    { q: "Which tooth is most likely to have a 2nd mesiobuccal canal (MB2)?", o: ["Maxillary 1st molar", "Mandibular 1st molar", "Maxillary 2nd molar", "Mandibular 2nd molar"], a: 0 },
    { q: "The 'Glickman' classification refers to:", o: ["Root fractures", "Furcation involvements", "Canal shapes", "Periapical lesions"], a: 1 },
    { q: "What is the primary component of Gutta-percha cones?", o: ["Gutta-percha (60%)", "Zinc Oxide (60-75%)", "Heavy metal salts", "Wax/Resin"], a: 1 },
    { q: "In which stage of root development should an apexification be performed?", o: ["Completely formed apex", "Incomplete apex with necrotic pulp", "Incomplete apex with vital pulp", "Primary teeth"], a: 1 },
    { q: "Which is NOT a contraindication for endodontic surgery?", o: ["Periodontal disease", "Unrestorable tooth", "Proximity to anatomic structures", "Presence of a sinus tract"], a: 3 },
    { q: "The 'Torsional Failure' of a NiTi file occurs when:", o: ["The file is bent too many times", "The tip binds while the handle continues to rotate", "The file is used in a dry canal", "The speed is too high"], a: 1 },
    { q: "Which canal is usually the largest in a Maxillary 1st Molar?", o: ["Mesiobuccal", "Distobuccal", "Palatal", "MB2"], a: 2 },
    { q: "What does the 'E' in 'EDTA' stand for?", o: ["Ethylene", "Ethanol", "Ethylenediamine", "Ester"], a: 2 },
    { q: "The 'walking bleach' technique uses which material?", o: ["Carbamide peroxide", "Sodium perborate", "Hydrogen peroxide 35%", "Phosphoric acid"], a: 1 },
    { q: "Which cell is the most numerous in the healthy dental pulp?", o: ["Odontoblast", "Fibroblast", "Macrophage", "Plasma cell"], a: 1 },
    { q: "The 'Working Length' is defined as the distance from a coronal reference point to:", o: ["The radiographic apex", "The anatomical apex", "The apical constriction (minor diameter)", "The major diameter"], a: 2 },
    { q: "Which of the following can cause a 'false positive' EPT response?", o: ["Liquefaction necrosis", "Immature apex", "Calcified canal", "Recent trauma"], a: 0 },
    { q: "The most common cause of vertical root fracture in endodontically treated teeth is:", o: ["Excessive condensation forces", "Post placement", "Occlusal trauma", "Masticatory forces"], a: 0 },
    { q: "Which pulp sensitivity test is best for teeth with full gold crowns?", o: ["EPT", "Cold (Endo-Ice)", "Percussion", "Palpation"], a: 1 },
    { q: "Cervical external resorption is often linked to:", o: ["Trauma", "Orthodontic treatment", "Bleaching", "All of the above"], a: 3 },
    { q: "What is the main purpose of a 'Seal' in endodontics?", o: ["To strengthen the root", "To prevent coronal and apical microleakage", "To kill remaining bacteria", "To make the tooth radiopaque"], a: 1 },
    { q: "How many canals are most frequently found in a mandibular 1st molar?", o: ["2", "3", "4", "5"], a: 1 },
    { q: "Which of the following is considered an 'extra-radicular' infection?", o: ["E. faecalis in the canal", "Actinomyces in the periapical lesion", "Prevotella in the pulp", "S. mutans in the dentin"], a: 1 },
    { q: "The 'buffer' capacity of the pulp is primarily due to:", o: ["Bicarbonate system", "High blood flow", "Odontoblasts", "Collagen"], a: 1 },
    { q: "Which of the following is a 'Zone of Fish' in periapical inflammation?", o: ["Zone of infection", "Zone of contamination", "Zone of irritation", "All of the above"], a: 3 },
    { q: "What is the 'Ludwig’s Angina'?", o: ["A localized abscess", "A cellulitis involving submandibular, sublingual, and submental spaces", "A heart condition", "A type of sinus infection"], a: 1 },
    { q: "Apexogenesis is indicated for:", o: ["Necrotic pulp in immature teeth", "Vital pulp in immature teeth", "Necrotic pulp in mature teeth", "Deciduous teeth only"], a: 1 }
]

const currentQNum = document.getElementById('current-q-num');
const liveScore = document.getElementById('live-score');

function loadQuestion() {
    resetState();
    // Update status display
    currentQNum.innerText = currentIdx + 1;
    liveScore.innerText = score;

    let currentQ = quizData[currentIdx];
    document.getElementById('question-text').innerText = `${currentIdx + 1}. ${currentQ.q}`;
    
    currentQ.o.forEach((option, index) => {
        const button = document.createElement('button');
        button.innerText = option;
        button.classList.add('btn');
        button.addEventListener('click', () => selectAnswer(index));
        oContainer.appendChild(button);
    });
}

function selectAnswer(index) {
    const buttons = oContainer.querySelectorAll('.btn');
    const correct = quizData[currentIdx].a;
    
    buttons.forEach(btn => btn.style.pointerEvents = 'none');

    if (index === correct) {
        score++;
        buttons[index].classList.add('correct');
        liveScore.innerText = score; // Update score immediately
    } else {
        buttons[index].classList.add('error');
        buttons[correct].classList.add('correct');
    }
    
    nextBtn.classList.remove('hide');
}
