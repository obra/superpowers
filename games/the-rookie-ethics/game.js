// The Rookie: Ethics on the Beat
// An ethical puzzle game inspired by The Rookie TV series

// Game State
let gameState = {
    currentScenario: 0,
    scores: {
        integrity: 100,
        protocol: 100,
        humanity: 100,
        trust: 100
    },
    choices: [],
    gameStarted: false
};

// Ethical Scenarios inspired by The Rookie
const scenarios = [
    {
        id: 1,
        title: "The Shoplifter's Dilemma",
        type: "Property Crime Response",
        description: `You respond to a shoplifting call at a grocery store. The suspect is a middle-aged woman who stole baby formula and diapers. As you approach, you notice she's crying and her clothes are worn. The store manager is demanding you arrest her immediately.

Upon talking to her, she explains she lost her job last month, her husband left, and she has a 6-month-old baby at home. She's never been in trouble before and is clearly desperate.`,
        quote: {
            character: "Training Officer",
            text: "The law is the law, rookie. But remember, we're here to serve the community, not just enforce rules blindly."
        },
        choices: [
            {
                id: "arrest",
                label: "Follow Protocol",
                text: "Arrest her for shoplifting. The law applies equally to everyone, regardless of circumstances.",
                outcome: {
                    type: "neutral",
                    title: "By the Book",
                    text: "You arrest the woman. She's processed and released with a court date. The store manager is satisfied. However, you later learn she couldn't make her court date because she had no childcare, resulting in a warrant. Her baby was temporarily placed in foster care. You followed protocol, but the outcome weighs on you.",
                    effects: { integrity: 0, protocol: 15, humanity: -20, trust: -5 }
                }
            },
            {
                id: "cite",
                label: "Issue Citation",
                text: "Issue a citation instead of arrest, allowing her to stay with her baby while facing consequences.",
                outcome: {
                    type: "positive",
                    title: "Balanced Justice",
                    text: "You issue a citation and explain her court date. You also provide information about local food banks and assistance programs. The store manager grumbles but accepts it. The woman thanks you tearfully and promises to make things right. She later pays restitution and gets connected with social services.",
                    effects: { integrity: 5, protocol: -5, humanity: 15, trust: 10 }
                }
            },
            {
                id: "let_go",
                label: "Let Her Go",
                text: "Convince the manager to drop charges and let her go with a warning.",
                outcome: {
                    type: "negative",
                    title: "Good Intentions, Bad Precedent",
                    text: "The manager reluctantly agrees after you explain her situation. However, word gets around that you let a shoplifter go. Other officers question your judgment, and the store manager later complains to your supervisor. Your training officer has a stern talk with you about selective enforcement.",
                    effects: { integrity: -10, protocol: -15, humanity: 10, trust: -10 }
                }
            },
            {
                id: "pay",
                label: "Pay for the Items",
                text: "Offer to pay for the items yourself to resolve the situation.",
                outcome: {
                    type: "neutral",
                    title: "Personal Sacrifice",
                    text: "You pay $47 from your own pocket. The manager is confused but accepts it. The woman is overwhelmed with gratitude. However, this sets an unsustainable precedent—you can't pay for every person in need. Your partner warns you about getting too emotionally involved.",
                    effects: { integrity: 5, protocol: -10, humanity: 20, trust: 0 }
                }
            }
        ]
    },
    {
        id: 2,
        title: "The Partner's Secret",
        type: "Internal Affairs Situation",
        description: `During a routine traffic stop, you notice your senior partner pocket $200 that fell out of the driver's wallet during the license check. The driver doesn't notice. Your partner has 15 years on the force, a family, and has been nothing but helpful to you as a rookie.

Later, your partner casually mentions, "Sometimes people lose things. It's just how it goes." They look at you meaningfully.`,
        quote: {
            character: "Academy Instructor's Words",
            text: "The blue wall of silence protects no one. It just delays the inevitable collapse of trust."
        },
        choices: [
            {
                id: "report",
                label: "Report to Internal Affairs",
                text: "File an official report with Internal Affairs about what you witnessed.",
                outcome: {
                    type: "positive",
                    title: "Integrity First",
                    text: "You report the incident. The investigation reveals this wasn't the first complaint against your partner. They're suspended pending investigation. Some officers treat you coldly, calling you a snitch. But the captain privately commends you, and honest officers respect your courage. Your partner eventually faces consequences, but the department is cleaner for it.",
                    effects: { integrity: 25, protocol: 20, humanity: -5, trust: -15 }
                }
            },
            {
                id: "confront",
                label: "Confront Your Partner",
                text: "Privately confront your partner and demand they return the money or you'll report them.",
                outcome: {
                    type: "neutral",
                    title: "Private Justice",
                    text: "Your partner is initially defensive but eventually returns the money anonymously to the driver's address. They're cold to you afterward, and the partnership becomes strained. You prevented further theft, but the underlying issue remains unaddressed. You wonder if they've done this before and will do it again.",
                    effects: { integrity: 10, protocol: -5, humanity: 5, trust: -5 }
                }
            },
            {
                id: "ignore",
                label: "Look the Other Way",
                text: "Pretend you didn't see anything. It's not worth destroying a career over $200.",
                outcome: {
                    type: "negative",
                    title: "Compromised",
                    text: "You stay silent. Your partner seems relieved and becomes friendlier. But you've crossed a line. When you later try to report a more serious violation by another officer, your credibility is questioned—someone saw you look away. The silence you chose has become a cage.",
                    effects: { integrity: -25, protocol: -20, humanity: 0, trust: 5 }
                }
            },
            {
                id: "supervisor",
                label: "Tell Your Supervisor Informally",
                text: "Mention it to your direct supervisor off the record, letting them decide how to handle it.",
                outcome: {
                    type: "neutral",
                    title: "Passing the Buck",
                    text: "Your supervisor thanks you but seems uncomfortable. They say they'll 'handle it.' Weeks pass with no apparent action. You later learn your supervisor and partner are old friends. You've technically reported it, but nothing changes. The moral weight still sits with you.",
                    effects: { integrity: 0, protocol: 5, humanity: 0, trust: 0 }
                }
            }
        ]
    },
    {
        id: 3,
        title: "The Domestic Call",
        type: "Domestic Violence Response",
        description: `You respond to a domestic disturbance. A woman has visible bruises and a black eye. Her husband, well-dressed and calm, explains she "fell down the stairs." The woman nods in agreement, but her eyes tell a different story.

You notice the husband is wearing a city council pin. He smiles and says, "Officer, I'm sure we can resolve this quietly. These things happen in marriages."`,
        quote: {
            character: "Veteran Detective",
            text: "In domestic cases, the victim's silence often speaks louder than their words. Learn to listen to what isn't being said."
        },
        choices: [
            {
                id: "separate",
                label: "Separate and Interview",
                text: "Insist on separating them and interviewing the woman privately, following DV protocol.",
                outcome: {
                    type: "positive",
                    title: "By the Book, With Heart",
                    text: "You separate them despite the husband's protests. Alone, the woman breaks down and admits the abuse. With victim advocates present, she agrees to press charges. The councilman threatens your career, but your supervisor backs you completely. 'Protocol exists for a reason,' she says. The case proceeds, and the woman gets help.",
                    effects: { integrity: 20, protocol: 20, humanity: 15, trust: 10 }
                }
            },
            {
                id: "believe_story",
                label: "Accept Their Story",
                text: "Accept the explanation and leave after confirming there's no immediate danger.",
                outcome: {
                    type: "negative",
                    title: "A Missed Opportunity",
                    text: "You leave, and the councilman thanks you warmly. Three weeks later, you respond to the same address. This time, the woman is in critical condition. She survives, but barely. The guilt is crushing—you had a chance to help her, and you let status and smooth words cloud your judgment.",
                    effects: { integrity: -20, protocol: -15, humanity: -25, trust: -10 }
                }
            },
            {
                id: "resources",
                label: "Provide Resources Quietly",
                text: "Slip the woman a domestic violence hotline card when her husband isn't looking.",
                outcome: {
                    type: "neutral",
                    title: "A Seed Planted",
                    text: "You discreetly give her the card. She hides it quickly. You leave without incident. Weeks later, she calls the hotline and eventually leaves her husband safely. You'll never know for certain if your card made the difference, but you followed your instincts while respecting her autonomy.",
                    effects: { integrity: 5, protocol: -10, humanity: 15, trust: 5 }
                }
            },
            {
                id: "photograph",
                label: "Document Everything",
                text: "Take detailed photos and notes of her injuries 'for the report,' creating a paper trail.",
                outcome: {
                    type: "positive",
                    title: "Building the Case",
                    text: "You thoroughly document everything, including her 'explanation' that doesn't match the injuries. When she finally comes forward months later, your detailed report becomes crucial evidence. The prosecutor thanks you for your thoroughness. The councilman is convicted. Sometimes justice takes time.",
                    effects: { integrity: 15, protocol: 15, humanity: 10, trust: 10 }
                }
            }
        ]
    },
    {
        id: 4,
        title: "The Chase Decision",
        type: "Pursuit Protocol",
        description: `A suspect in a convenience store robbery flees in a vehicle. You're the closest unit. The pursuit enters a residential neighborhood with children playing outside. The suspect is driving increasingly erratically, running stop signs.

Dispatch reports the robbery netted only $83, and no weapon was displayed. Your supervisor asks for your assessment of the pursuit.`,
        quote: {
            character: "Training Officer",
            text: "Every pursuit is a calculation: what are we chasing versus what are we risking? Sometimes the bravest thing is knowing when to stop."
        },
        choices: [
            {
                id: "continue",
                label: "Continue Pursuit",
                text: "Continue the chase—letting criminals escape sends the wrong message to the community.",
                outcome: {
                    type: "negative",
                    title: "Tragic Consequences",
                    text: "You continue the pursuit. The suspect runs a red light and T-bones a minivan. A mother and her 8-year-old daughter are seriously injured. The suspect is caught, but at what cost? The $83 robbery becomes a vehicular assault case, but the community questions whether it was worth it. The mother's injuries are permanent.",
                    effects: { integrity: -10, protocol: -15, humanity: -25, trust: -20 }
                }
            },
            {
                id: "terminate",
                label: "Terminate Pursuit",
                text: "Call off the chase—the risk to public safety outweighs the crime committed.",
                outcome: {
                    type: "positive",
                    title: "Calculated Restraint",
                    text: "You terminate the pursuit and broadcast the vehicle description. The suspect abandons the car ten blocks away and is caught by another unit on foot. Your supervisor commends your judgment. 'We got him anyway, and nobody got hurt,' she notes. The community never knows about the chase that almost was.",
                    effects: { integrity: 10, protocol: 15, humanity: 20, trust: 15 }
                }
            },
            {
                id: "helicopter",
                label: "Request Air Support",
                text: "Back off but request helicopter support to maintain visual contact safely.",
                outcome: {
                    type: "positive",
                    title: "Smart Policing",
                    text: "Air support takes over while you drop back. The helicopter tracks the suspect to his apartment, where he's arrested without incident an hour later. The case is solid, and no one was endangered. Your supervisor notes your tactical thinking in your evaluation.",
                    effects: { integrity: 10, protocol: 20, humanity: 15, trust: 10 }
                }
            },
            {
                id: "spike_strips",
                label: "Request Spike Strips Ahead",
                text: "Request units ahead to deploy spike strips in a safe location.",
                outcome: {
                    type: "neutral",
                    title: "Controlled Conclusion",
                    text: "Spike strips are deployed on an empty stretch of road. The suspect's tires are shredded, and he's apprehended after a brief foot chase. It worked this time, but the coordination was risky—the suspect could have swerved into oncoming traffic. Your supervisor notes it was a judgment call that happened to work out.",
                    effects: { integrity: 5, protocol: 10, humanity: 5, trust: 5 }
                }
            }
        ]
    },
    {
        id: 5,
        title: "The Witness Protection",
        type: "Witness Intimidation",
        description: `A key witness in a gang murder case approaches you, terrified. She's been receiving death threats and her apartment was vandalized. She's considering recanting her testimony. Without her, a murderer walks free.

She begs you, "Can't you do something? Anything? I can't live like this, but I can't let him get away with killing Marcus either."`,
        quote: {
            character: "Homicide Detective",
            text: "Witnesses put their lives on the line for justice. The least we can do is make sure that sacrifice means something."
        },
        choices: [
            {
                id: "official_protection",
                label: "Arrange Official Protection",
                text: "Fast-track her into the official witness protection program through proper channels.",
                outcome: {
                    type: "positive",
                    title: "System Works",
                    text: "You expedite her case through the witness protection unit. It takes 48 stressful hours, but she's relocated to a safe house. She testifies via video link, and the murderer is convicted. The process was slow and she was scared, but the system worked as intended.",
                    effects: { integrity: 15, protocol: 20, humanity: 10, trust: 15 }
                }
            },
            {
                id: "unofficial_protection",
                label: "Provide Unofficial Protection",
                text: "Organize off-duty officers to watch her apartment until the trial.",
                outcome: {
                    type: "neutral",
                    title: "Good Intentions, Gray Area",
                    text: "Fellow officers volunteer their off-duty time. The witness feels safer and testifies successfully. However, defense attorneys later raise questions about 'unofficial police activity,' nearly causing a mistrial. The conviction holds, but your supervisor warns you about coloring outside the lines.",
                    effects: { integrity: 5, protocol: -15, humanity: 15, trust: 5 }
                }
            },
            {
                id: "advise_recant",
                label: "Advise Her to Recant",
                text: "Tell her that her safety comes first—she should do what she needs to survive.",
                outcome: {
                    type: "negative",
                    title: "Justice Denied",
                    text: "She recants, and the case falls apart. The murderer walks free. Three months later, he kills again. The witness lives with the guilt, and so do you. Her physical safety was preserved, but at what cost to her conscience—and to the next victim?",
                    effects: { integrity: -15, protocol: 0, humanity: -10, trust: -15 }
                }
            },
            {
                id: "investigate_threats",
                label: "Investigate the Threats",
                text: "Focus on finding who's making the threats and arrest them for witness intimidation.",
                outcome: {
                    type: "positive",
                    title: "Addressing the Root Cause",
                    text: "You work with detectives to trace the threats. You identify and arrest two gang members for witness intimidation. This not only protects your witness but adds charges to the case. The witness testifies confidently, knowing her threateners are in custody. Double justice.",
                    effects: { integrity: 20, protocol: 15, humanity: 15, trust: 20 }
                }
            }
        ]
    },
    {
        id: 6,
        title: "The Body Camera Dilemma",
        type: "Evidence Integrity",
        description: `After a tense arrest where you used force to subdue a resisting suspect, you review your body camera footage. You realize it clearly shows you struck the suspect one more time than was necessary—after he was already restrained.

Your partner's camera malfunctioned and didn't record. Only you know about this footage. Internal Affairs hasn't requested it yet.`,
        quote: {
            character: "Police Ethics Instructor",
            text: "The camera sees everything, but integrity is what you do when you think no one is watching. The irony is, you're always watching yourself."
        },
        choices: [
            {
                id: "submit_full",
                label: "Submit Complete Footage",
                text: "Submit the full, unedited footage and report your own excessive force.",
                outcome: {
                    type: "positive",
                    title: "Accountability",
                    text: "You submit everything and write a detailed self-report. There's an investigation, a suspension, and mandatory retraining. It's humiliating and painful. But when you return, you're different—better. Fellow officers respect your honesty. The community activist who was calling for your badge becomes an unexpected ally.",
                    effects: { integrity: 30, protocol: 20, humanity: 10, trust: 15 }
                }
            },
            {
                id: "delete",
                label: "Delete the Footage",
                text: "Delete the problematic portion of the footage—no one will ever know.",
                outcome: {
                    type: "negative",
                    title: "The Cover-Up",
                    text: "You delete the footage. Weeks later, a bystander's cell phone video surfaces showing the incident from another angle. Now you're facing charges for excessive force AND evidence tampering. Your career is over, and you face criminal prosecution. The cover-up is always worse than the crime.",
                    effects: { integrity: -30, protocol: -25, humanity: -15, trust: -30 }
                }
            },
            {
                id: "keep_quiet",
                label: "Keep Footage, Stay Silent",
                text: "Don't delete anything, but don't volunteer the information either. Wait to see if anyone asks.",
                outcome: {
                    type: "negative",
                    title: "Living in Limbo",
                    text: "You keep the footage but say nothing. Every day you wait for the knock on your door. The stress affects your work, your relationships, your health. When the footage is eventually discovered during a routine audit, your silence is viewed as nearly as damning as destruction would have been.",
                    effects: { integrity: -15, protocol: -10, humanity: -5, trust: -15 }
                }
            },
            {
                id: "partner_advice",
                label: "Seek Partner's Advice",
                text: "Show your partner the footage and ask what you should do.",
                outcome: {
                    type: "neutral",
                    title: "Shared Burden",
                    text: "Your partner watches soberly. 'That's a career-ender,' they say. But they also say, 'You know what you have to do.' With their support, you report yourself. Having someone in your corner makes the process bearable. Your partner later tells you they're proud of you.",
                    effects: { integrity: 20, protocol: 15, humanity: 10, trust: 10 }
                }
            }
        ]
    },
    {
        id: 7,
        title: "The Informant's Request",
        type: "Confidential Informant Ethics",
        description: `Your confidential informant has provided crucial intel that's helped solve three major cases. Now she's asking for a favor: her teenage son was caught with a small amount of marijuana. She wants you to make it disappear.

"I've risked my life for you people," she says. "My son made a mistake. He's not a dealer. Please."`,
        quote: {
            character: "Narcotics Supervisor",
            text: "Informants are assets, not friends. The moment you cross that line, you become their asset instead."
        },
        choices: [
            {
                id: "refuse",
                label: "Refuse Firmly",
                text: "Explain that you cannot interfere with another officer's case, regardless of her contributions.",
                outcome: {
                    type: "positive",
                    title: "Lines Maintained",
                    text: "She's angry and hurt, but you hold firm. Her son goes through the juvenile diversion program and actually gets help. Six months later, she reluctantly admits you were right—her son is doing better, and your relationship, while strained, remains professional. Your integrity is intact.",
                    effects: { integrity: 20, protocol: 20, humanity: 0, trust: 5 }
                }
            },
            {
                id: "help_legally",
                label: "Help Within Bounds",
                text: "Offer to write a character reference and connect her son with a good public defender.",
                outcome: {
                    type: "positive",
                    title: "Appropriate Support",
                    text: "You write an honest letter about the mother's cooperation with law enforcement and help them navigate the legal system. The son receives diversion instead of prosecution. You helped without crossing lines. The informant is grateful, and your working relationship actually improves.",
                    effects: { integrity: 10, protocol: 10, humanity: 15, trust: 15 }
                }
            },
            {
                id: "make_disappear",
                label: "Make It Disappear",
                text: "Pull strings to lose the paperwork and make the arrest vanish.",
                outcome: {
                    type: "negative",
                    title: "Corrupted",
                    text: "You make it disappear. But now she knows she owns you. Her requests become more frequent, more serious. When she asks you to tip her off about a raid targeting her cousin, you realize you're in too deep. You've become the thing you swore to fight.",
                    effects: { integrity: -25, protocol: -25, humanity: 5, trust: -20 }
                }
            },
            {
                id: "transfer_case",
                label: "Request Case Transfer",
                text: "Ask to have the case transferred to avoid the conflict of interest, and recuse yourself entirely.",
                outcome: {
                    type: "neutral",
                    title: "Conflict Avoided",
                    text: "You explain the conflict of interest to your supervisor and recuse yourself. The case proceeds normally without your involvement. The informant is disappointed but can't claim you treated her son unfairly. It's not the outcome she wanted, but it's the cleanest path.",
                    effects: { integrity: 15, protocol: 15, humanity: 5, trust: 5 }
                }
            }
        ]
    },
    {
        id: 8,
        title: "The Final Call",
        type: "End of Shift Decision",
        description: `It's the last scenario of your shift. You pull over a car for a broken taillight. The driver is nervous—too nervous. You smell marijuana. When you ask him to step out, you notice a bulge in his jacket.

He's young, maybe 20. He starts crying and says, "Please, officer. I just got out. I can't go back. It's just a little weed and... and something for protection. The streets are dangerous."

He has a prior conviction. Another drug charge means mandatory minimums. The gun—likely illegal—adds years.`,
        quote: {
            character: "Your Own Conscience",
            text: "In the end, you have to live with every choice you make. The badge comes off at night, but you're still you."
        },
        choices: [
            {
                id: "full_arrest",
                label: "Full Search and Arrest",
                text: "Conduct a full search, find everything, and let the justice system do its job.",
                outcome: {
                    type: "neutral",
                    title: "The Law's Weight",
                    text: "You find marijuana, an illegal handgun, and $400 in cash. He's arrested and faces 8-15 years. He sobs as he's placed in the car. You followed every protocol perfectly. At home that night, you stare at the ceiling wondering about the system you serve. Is this justice?",
                    effects: { integrity: 5, protocol: 25, humanity: -15, trust: 0 }
                }
            },
            {
                id: "taillight_only",
                label: "Taillight Warning Only",
                text: "Decide you only have reasonable suspicion, not probable cause. Issue a warning for the taillight and let him go.",
                outcome: {
                    type: "negative",
                    title: "Willful Blindness",
                    text: "You issue a warning and let him drive away. A week later, that same gun is used in a robbery where a store clerk is wounded. The young man is caught anyway, but now with a violent crime attached. Your act of mercy enabled a tragedy. Could you have known? No. Does that help you sleep? Also no.",
                    effects: { integrity: -15, protocol: -20, humanity: 10, trust: -10 }
                }
            },
            {
                id: "confiscate_release",
                label: "Confiscate and Release",
                text: "Take the gun and drugs, destroy them, and let him go with a fierce warning. No paperwork.",
                outcome: {
                    type: "negative",
                    title: "Noble Corruption",
                    text: "You destroy the evidence and send him away terrified but free. He actually does turn his life around—you run into him years later, now working at a community center. But you know what you did was illegal. You're not a hero; you're a cop who broke the law for a good outcome. The ends don't always justify the means.",
                    effects: { integrity: -10, protocol: -25, humanity: 20, trust: -5 }
                }
            },
            {
                id: "connect_services",
                label: "Arrest, But Advocate",
                text: "Make the arrest, but personally connect him with reentry services and speak at his sentencing hearing.",
                outcome: {
                    type: "positive",
                    title: "Justice With Humanity",
                    text: "You arrest him properly but treat him with dignity. You testify honestly at his hearing while also speaking to his apparent desire to change. The judge, moved by your unusual advocacy, gives the minimum sentence and mandates rehabilitation. He writes you a letter from prison: 'You arrested me but you also saw me. Thank you.'",
                    effects: { integrity: 15, protocol: 15, humanity: 20, trust: 15 }
                }
            }
        ]
    }
];

// Calculate final rank based on scores
function calculateRank() {
    const total = Object.values(gameState.scores).reduce((a, b) => a + b, 0);
    const average = total / 4;

    if (average >= 120) return { rank: "Exemplary Officer", icon: "🌟", description: "You've demonstrated exceptional judgment, balancing law enforcement with humanity. You're the officer every rookie should aspire to be." };
    if (average >= 100) return { rank: "Distinguished Officer", icon: "⭐", description: "You've shown strong ethical judgment throughout your shift. Your decisions reflect a thoughtful approach to policing." };
    if (average >= 80) return { rank: "Competent Officer", icon: "👮", description: "You've handled difficult situations adequately, though some choices could have been better. There's room for growth." };
    if (average >= 60) return { rank: "Developing Officer", icon: "📋", description: "Your shift revealed some concerning patterns. Additional training and mentorship are recommended." };
    return { rank: "Needs Improvement", icon: "⚠️", description: "Your choices today raise serious concerns. A review with your training officer is required before your next shift." };
}

// Update UI with current scores
function updateScoreDisplay() {
    document.getElementById('integrity-score').textContent = gameState.scores.integrity;
    document.getElementById('protocol-score').textContent = gameState.scores.protocol;
    document.getElementById('humanity-score').textContent = gameState.scores.humanity;
    document.getElementById('trust-score').textContent = gameState.scores.trust;

    // Update progress bar
    const progress = ((gameState.currentScenario) / scenarios.length) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;
}

// Render current scenario
function renderScenario() {
    const scenario = scenarios[gameState.currentScenario];
    const container = document.getElementById('scenario-container');

    let choicesHTML = scenario.choices.map(choice => `
        <button class="choice-btn" onclick="makeChoice('${choice.id}')">
            <div class="choice-label">${choice.label}</div>
            <div>${choice.text}</div>
        </button>
    `).join('');

    container.innerHTML = `
        <div class="scenario-card">
            <div class="scenario-header">
                <span class="scenario-number">Scenario ${scenario.id} of ${scenarios.length}</span>
                <span class="scenario-type">${scenario.type}</span>
            </div>
            <h2 class="scenario-title">${scenario.title}</h2>
            <p class="scenario-description">${scenario.description}</p>
            <div class="character-quote">
                <span class="character-name">${scenario.quote.character}:</span> "${scenario.quote.text}"
            </div>
            <div class="choices-container" id="choices-container">
                ${choicesHTML}
            </div>
            <div id="outcome-container"></div>
        </div>
    `;
}

// Handle player choice
function makeChoice(choiceId) {
    const scenario = scenarios[gameState.currentScenario];
    const choice = scenario.choices.find(c => c.id === choiceId);

    // Disable all choice buttons
    document.querySelectorAll('.choice-btn').forEach(btn => btn.disabled = true);

    // Record the choice
    gameState.choices.push({
        scenarioId: scenario.id,
        choiceId: choiceId,
        outcome: choice.outcome
    });

    // Apply score effects
    Object.entries(choice.outcome.effects).forEach(([stat, change]) => {
        gameState.scores[stat] = Math.max(0, Math.min(150, gameState.scores[stat] + change));
    });

    // Update score display
    updateScoreDisplay();

    // Show outcome
    const outcomeContainer = document.getElementById('outcome-container');
    const statChanges = Object.entries(choice.outcome.effects)
        .filter(([_, change]) => change !== 0)
        .map(([stat, change]) => {
            const className = change > 0 ? 'stat-up' : 'stat-down';
            const prefix = change > 0 ? '+' : '';
            return `<span class="${className}">${stat.charAt(0).toUpperCase() + stat.slice(1)}: ${prefix}${change}</span>`;
        }).join('');

    outcomeContainer.innerHTML = `
        <div class="outcome-card ${choice.outcome.type}">
            <h3 class="outcome-title">${choice.outcome.title}</h3>
            <p class="outcome-text">${choice.outcome.text}</p>
            <div class="stat-change">${statChanges}</div>
        </div>
        <button class="next-btn" onclick="nextScenario()">
            ${gameState.currentScenario < scenarios.length - 1 ? 'Next Scenario' : 'End Shift'}
        </button>
    `;
}

// Move to next scenario or end game
function nextScenario() {
    gameState.currentScenario++;

    if (gameState.currentScenario >= scenarios.length) {
        endGame();
    } else {
        renderScenario();
        updateScoreDisplay();
    }
}

// Start the game
function startGame() {
    gameState = {
        currentScenario: 0,
        scores: { integrity: 100, protocol: 100, humanity: 100, trust: 100 },
        choices: [],
        gameStarted: true
    };

    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('stats-display').classList.remove('hidden');
    document.getElementById('progress-bar').classList.remove('hidden');
    document.getElementById('scenario-container').classList.remove('hidden');

    updateScoreDisplay();
    renderScenario();
}

// End the game and show results
function endGame() {
    const rankInfo = calculateRank();

    document.getElementById('scenario-container').classList.add('hidden');
    document.getElementById('end-screen').classList.remove('hidden');

    const finalStats = document.getElementById('final-stats');
    finalStats.innerHTML = `
        <div class="stat-box">
            <div class="stat-label">Final Integrity</div>
            <div class="stat-value">${gameState.scores.integrity}</div>
        </div>
        <div class="stat-box">
            <div class="stat-label">Final Protocol</div>
            <div class="stat-value">${gameState.scores.protocol}</div>
        </div>
        <div class="stat-box">
            <div class="stat-label">Final Humanity</div>
            <div class="stat-value">${gameState.scores.humanity}</div>
        </div>
        <div class="stat-box">
            <div class="stat-label">Final Trust</div>
            <div class="stat-value">${gameState.scores.trust}</div>
        </div>
    `;

    document.getElementById('rank-display').innerHTML = `${rankInfo.icon} ${rankInfo.rank}`;
    document.getElementById('summary-text').textContent = rankInfo.description;
}

// Restart the game
function restartGame() {
    document.getElementById('end-screen').classList.add('hidden');
    document.getElementById('stats-display').classList.add('hidden');
    document.getElementById('progress-bar').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('The Rookie: Ethics on the Beat loaded successfully');
});
