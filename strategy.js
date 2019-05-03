var characters = []
var nudgeStrength = 40
class Character {
    constructor(name, traits, colour) {
        this.name = name
        this.traits = traits
        this.nudged = {}
        this.publicKnowledge = {}
        this.colour = colour
        characters.push(this)
    }

    gloat() {
        var text = [
            "Ha!",
            "It's mine now",
            "You aren't getting it back",
            "Take that!",
            "Still feeling smug?",
            "Poor move",
            "And this time I'm keeping it."
        ]
        var r = Math.floor(Math.random() * text.length)
        if (Math.random() < 0.3) {
            announce(this, text[r])
        }
    }

    despair() {
        var text = [
            "Oh no!",
            "Give it back!",
            "How could you!",
            "I thought we were friends.",
            "Can't we play a different game?",
            "You're just like this because you're winning."
        ]
        var r = Math.floor(Math.random() * text.length)
        if (Math.random() < 0.3) {
            announce(this, text[r])
        }
    }

    get traitText() {
        var s = ""
        for (var k in this.traits) {
            if (this.traits[k] != 0) {
                if (s !== "") {
                    s += ", "
                }
                s += k
                if (this.traits[k] !== 1) {
                    s += " (" + this.traits[k] + ")"
                }
            }
        }
        for (var k in this.nudged) {
            if (this.nudged[k] != 0) {
                if (s !== "") {
                    s += ", "
                }
                s += "nudged: " + choiceNames[k]
                if (this.nudged[k] !== 1) {
                    s += " (" + this.nudged[k] + ")"
                } else {
                    s += " (" + this.nudged[k] + ")"
                }
            }
        }
        if (s == "") { s += "(none)" }
        return s
    }


    get distribution() {
        var p = this
        var trait = function (n) {
            return p.traits[n] || 0
        }

        var holds = function (k) {
            return boardHistory[0][k] == p.name ? 1 : 0
        }
        var nudge = function (k) {
            return p.nudged[k] > 0 ? 1 : 0
        }

        var c = [5, 5, 5, 5, 5]
        var devotionStrength = 15
        var defensiveStrength = 5
        c[0] += devotionStrength * trait("devout") +
            nudgeStrength * nudge(0)
        c[1] += devotionStrength * trait("militaristic") +
            nudgeStrength * nudge(1)
        c[2] += devotionStrength * trait("miserly") +
            nudgeStrength * nudge(2)
        c[3] += devotionStrength * trait("scholarly") +
            nudgeStrength * nudge(3)
        c[4] += devotionStrength * trait("populist") +
            nudgeStrength * nudge(4)
        for (var k in c) {
            if (holds(k)) { c[k] = 0 }
        }
        return c.map(e => Math.max(0, e))
    }

    get nextChoice() {
        var d = this.distribution
        d.map(e => Math.max(0, e))
        var s = d.reduce((a, b) => a + b)
        var r = Math.random()
        for (var k in this.nudged) {
            if (this.nudged[k] > 0) {
                this.nudged[k] -= 1
            }
        }
        for (var k in d) {
            r = r - d[k] / s
            if (r < 0) {
                return k
            }
        }
    }
    get percentages() {
        var d = this.distribution
        d.map(e => Math.max(0, e))
        var s = d.reduce((a, b) => a + b)
        return d.map(x => x / s)
    }
}

var boardHistory = []

var nudgeName = function (name, choice) {
    nudge(characters.filter(c => c.name == name)[0], choice)
}

var nudgeDuration = 3
var nudge = function (character, choice) {

    if (turnType == "nudge") {
        character.nudged[choice] = nudgeDuration
        turnType = "choose"
    }
    displayTurns()
}

var turnType = "" // choose, nudge or win

var choiceNames = ["Religion", "Military", "Financial", "Learning", "Popularity"]

var takeTerritory = function (playerChoice) {
    if (turnType = "choose") {
        turnType = "nudge"
        var aState = boardHistory[0]
        var choices = [[], [], [], [], []]
        characters.forEach(p => {
            var c = p.nextChoice
            choices[c].push(p.name)
        })
        var last = boardHistory.length > 1 ? boardHistory[1] : {}
        // Insert player choice here
        choices[playerChoice].push("Player")
        var territory = aState.map(k => k).slice(0, 5)
        for (var k in choices) {
            if (choices[k].length == 1) {
                territory[k] = choices[k][0]
                if (choices[k][0] !== last[k]) {
                    characters.filter(p => p.name == choices[k][0]).forEach(p => p.gloat())
                    characters.filter(p => p.name == last[k]).forEach(p => p.despair())
                }
            }
        }
        territory.push(choices)
        boardHistory.unshift(territory)
    }
    displayTurns()
}

var glyph = function (name) {
    return `<div class="glyph" onmouseover="highlight('${name[0]}')" onmouseout="highlight()">${name[0]}</div>`
}

var highlight = function (glyph) {
    $(".glyph").filter((i, e) => ($(e).text() == glyph)).addClass("highlight")
    $(".glyph").filter((i, e) => ($(e).text() !== glyph)).removeClass("highlight")
}

var colour = function (name) {
    if (name == "") { return "background-color: #dab" }
    var colour = name !== "Player" ? characters.filter(c => c.name == name)[0].colour : "#fdd"
    return `background-color: ${colour}`
}

var displayTurn = function (boardState) {
    var s = ""
    //boardState.slice(0, 5).forEach(owner => s += `<div class="owner cell">${owner}</div>`)
    boardState[5].forEach((pretenderChoices, i) => s += `<div
     style="${colour(boardState[i])}"
     class="pretenders cell ${choiceNames[i]}">${pretenderChoices.map(glyph).reduce((a, b) => a + b, "")}</div>`)
    return s
}

var displayTurns = function () {
    var s = ""

    s += `
    <div class="heading row"><h1>Tiny Little Nudges</h1></div> 
    <div class="row">
    <p>
    This is a very small game about anticipation.
    The rules are simple: Every player declares which area they are going to invest in this turn.
    If only one player chooses an area, then that area belongs to that player.
    Otherwise, the area's ownership doesn't change.
    The aim is to end up in control of three areas.
    </p>
    </div>`


    s += `
    <div class="heading row"><h2>Your choices</h2></div>
    <div class="row">
    <p>
    Each turn you do two things:
    <ul>
    <li>Nudge an opponent towards a particular area (adds ${nudgeStrength} interest, lasts ${nudgeDuration} turns)</li>
    <li>Choose an area to try and claim</li>
    </ul>
    </p>
    </div>`

    s += `
    <div class="heading row"><h2>The Playing Board</h2></div>
    <div class="row">
    <p>
    Here are the characters.
    First, there are your five opponents.
    Your spies have gathered information about their characteristics (which change each time you start a new game) and the choice they are likely to make this turn.
    The likelihood they will make a decision is proportional to the number in that column.
    Finally there is you, the player.
    Remember you want to nudge an opposing character into a decision that leaves you free to claim an area,
    or to have them fight over reclaiming an area you own.
    </p>
    <p>
    The blue colour indicates where your opponents are thinking of moving.
    The pink colour shows where they chose last turn. First person to control three areas wins.
    </p>
    </div>`

    if (getWinner()) {
        s += `
    <div class="heading row"><h2>A winner!</h2></div>
    <div class="row">
    <p>
    `
        if (getWinner() == "Player") {
            s += "Congratulations! You have gained control of three areas and won the game!"
        } else {
            s += getWinner() + ` has gained control of three areas, and won the game!`
        }
        s += ` 
        <button onclick="resetBoard();displayTurns()">Click here to play again.</button>
    </p>
    </div>`
    } else {

        s += `<div class="emptyrow"></div>`

        choiceNames.forEach((c, i) => s += `<div class="territory cell ${choiceNames[i]}">
    ${c}
    </div>`)
        s += `<div class="emptyrow"></div>`

        characters.forEach(c => s += displayCharacter(c))

        // Player

        s += `
    
    <div class="emptyrow"></div>`

        // Arrows

        if (turnType == "nudge") {
            s += `<div class="row heading"><strong>&#x2B06; Click a button to nudge a character towards that choice &#x2B06;</strong> </div>`
        } else {
            s += `<div class="row  heading"><strong>&#x2B07; Choose which area to try and claim	&#x2B07;  </strong></div>`
        }


        s += `<div class="threetall" style="${colour('Player')}"}>${glyph('Player')}</div>
    <!--<div class="cell label">Name:</div> -->
    <div class="semirow">Player <span class="traits">(this is you)</span></div>
    
    `


        choiceNames.forEach((c, i) => s += `<div class="territory cell ${choiceNames[i]}">
    <button class="takeTerritory" onclick="takeTerritory(${i})">${c}</button>
    </div>`)

        // Current ownership

        s += `<div class="emptyrow"></div>
    <div class="heading row"><h2>Current ownership</h2></div>
    `

        choiceNames.forEach((c, i) => s += `<div class="pretenders territory cell ${choiceNames[i]}"
    style="${colour(boardHistory[0][i])}; text-align:center;">
    ${glyph(boardHistory[0][i])}
    </div>`)

        s += `<div class="emptyrow"></div>`



        // History
    }

    s += `<div class="emptyrow"></div>
        <div class="heading row"><h2>Turn history</h2></div>
        <div class="heading row">
        <p>
        The choices every character made is shown here, with the most recent turn shown at the top.
        </p>
        </div>
        `




    for (var k in boardHistory) {
        if (k == 0) {
            // s += `<div class="cell label">Current ownership:</div>`
        }
        if (k < boardHistory.length - 1) {
            switch (k) {
                case "0":
                    s += `<div class="historyNumbers">Last turn</div>`
                    break;
                case "1":
                    s += `<div class="historyNumbers">1 turn ago</div>`
                    break;
                default:
                    s += `<div class="historyNumbers">${k} turns ago</div>`
                    break;
            }
            s += displayTurn(boardHistory[k])
        }

    }
    $("#gameContent").html(s)
    switch (turnType) {
        case "nudge":
            $("button.takeTerritory").prop("disabled", true)
            $("button.nudge").prop("disabled", false)
            break;
        case "choose":
            $("button.takeTerritory").prop("disabled", false)
            $("button.nudge").prop("disabled", true)
            break;
    }

}

var randomTrait = function () {
    var choices = [
        { devout: 1 },
        { militaristic: 1 },
        { miserly: 1 },
        { scholarly: 1 },
        { populist: 1 }
    ]
    var r = Math.floor(Math.random() * choices.length)
    return choices[r]
}

var randomTraits = function (n) {
    var base = randomTrait()
    if (n > 1) {
        var mixin = randomTraits(n - 1)
    } else {
        var mixin = {}
    }
    for (var k in mixin) {
        base[k] = (base[k] || 0) + mixin[k]
    }
    return base
}

var displayCharacter = function (character) {
    var s = ""
    s += `<div class="threetall" id="portrait${character.name}" style="${colour(character.name)}"}>${glyph(character.name)}</div>
    <!--<div class="cell label">Name:</div> -->
    <div class="semirow">${character.name}
    <span class="traits">(${character.traitText})</span>
    </div>
    `

    var percentages = character.percentages.map(x => 1.5 * Math.floor(100 * x))
    for (var k in character.distribution) {
        if (boardHistory.length > 1) {
            var choseLastTime = boardHistory[0][5][k].includes(character.name)
        }
        s += `<div id="${character.name}${k}" class="cell distribution ${choiceNames[k]} ${choseLastTime ? "fadeFrom" : ""}">
            <button class="nudge"
            style="background-color: rgb(${255 - percentages[k]},${255 - percentages[k]},${255})"
             onclick="nudgeName('${character.name}',${k})">${character.distribution[k]}</button>
            </div>`
    }
    s += `
    
    <div class="emptyrow"></div>`
    return s
}

var resetBoard = function () {
    boardHistory = [
        ["Lars", "Anita", "Robin", "Julia", "Gwyn", []]
    ]
    turnType = "nudge"

    characters = []
    var genTraits = 2
    var p1 = new Character("Lars", randomTraits(genTraits), "#bdc")
    var p2 = new Character("Anita", randomTraits(genTraits), "#cbd")
    var p3 = new Character("Robin", randomTraits(genTraits), "#cdb")
    var p4 = new Character("Julia", randomTraits(genTraits), "#bcd")
    var p5 = new Character("Gwyn", randomTraits(genTraits), "#dcb")

}

var announce = function (character, message) {
    var portrait = $(`#portrait${character.name}`).position()
    console.log(portrait)
    $("#alerts").append(
        $("<div>").text(message)
            .css("top", Math.floor(portrait.top - 35 + Math.random() * 25))
            .css("left", Math.floor(portrait.left + 46 + Math.random() * 25))
            .addClass("alert")
            .animate({ top: Math.floor(portrait.top - 300 - 100 * Math.random()), opacity: 0 }, 2000 + (message.length * 200), "linear", function () {
                $(this).hide()
            })
    )
}
var getWinner = function () {
    var last = boardHistory[0]
    var points = {}
    for (var k in boardHistory[0].slice(0, boardHistory[0].length)) {
        points[boardHistory[0][k]] = (points[boardHistory[0][k]] || 0) + 1
    }
    for (var k in points) {
        if (points[k] > 2) {
            return k
        }
    }
    return false
}