let tableToRender = document.querySelectorAll("tbody")





let table = document.getElementById("data")
let membersData = [];
let partyArray = [];
let stateID = "";
let filteredMembers = []
let sortCriteria = ""


// FETCH
let loader = document.getElementById("loader")
let main = document.getElementById("main")
let chamber = document.querySelector("body").id
const endpoint = `https://api.propublica.org/congress/v1/113/${chamber}/members.json`
const init = {
    headers: {
        "X-API-key": "eObmd0hjXfacZmdqvTlfLNE1iyVFB4jp8yxtLqDP"
    }
}

const app = Vue.createApp({
    // funcion data, devuelve un objeto con mucha información
    data() {
        return {
            membersData,
            filteredMembers,
            empty: false,
            partyArray: [],
            stateArray: ["Select All"],
            stateID: "Select All",
            sortCriteria: [],
            ascendente: true,
            statistics: {
                total: [],
                parties: [
                    {
                        id: "D",
                        name: "Democrats",
                        members: [],
                        averageVotes: 0,
                        averageMissed: 0
                    },
                    {
                        id: "R",
                        name: "Republicans",
                        members: [],
                        averageVotes: 0,
                        averageMissed: 0
                    },
                    {
                        id: "ID",
                        name: "Independents",
                        members: [],
                        averageVotes: 0,
                        averageMissed: 0
                    }
                ],
                most_loyals: [],
                least_loyals: [],
                least_engaged: [],
                most_engaged: [],
                totalAverageVotes: [],
                totalAverageMissed: []
            }
        }
    },
    created() {
        fetch(endpoint, init)
            .then(respuesta => respuesta.json())
            .then(data => {

                this.membersData = data.results[0].members
                this.filteredMembers = this.membersData
                this.fillData();
                this.selectInfo();
                loader.style.visibility = "hidden";
                main.style.visibility = "visible"
            })
            .catch(err => console.error(err.message))
    },
    methods: {
        fillData() {
            this.statistics.total = this.membersData
                .map(member => {
                    let member_info = {
                        url: member.url,
                        last_name: member.last_name,
                        middle_name: member.middle_name,
                        first_name: member.first_name,
                        votes_against: Math.round(member.votes_against_party_pct * member.total_votes / 100),
                        votes_with: Math.round(member.votes_with_party_pct * member.total_votes / 100),
                        party: member.party,
                        missed_votes: member.missed_votes,
                        missed_votes_pct: member.missed_votes_pct,
                        total_votes: member.total_votes,
                        votes_against_party_pct: member.votes_against_party_pct,
                        votes_with_party_pct: member.votes_with_party_pct
                    }
                    return member_info;
                })

            this.statistics.parties.forEach(party => {
                party.members = this.statistics.total.filter(member => member.party === party.id)
                party.averageVotes = Number(this.getAverageVotes(party.members, "votes_with_party_pct").toFixed(2))
                party.averageVotes > 0 && this.statistics.totalAverageVotes.push(party.averageVotes)
                party.averageMissed = Number(this.getAverageVotes(party.members, "missed_votes_pct").toFixed(2))
                party.averageMissed > 0 && this.statistics.totalAverageMissed.push(party.averageMissed)

            })

            this.statistics.totalAverageMissed = (this.statistics.totalAverageMissed.reduce((acum, num) => acum += num) / this.statistics.totalAverageMissed.length).toFixed(2)
            this.statistics.totalAverageVotes = (this.statistics.totalAverageVotes.reduce((acum, num) => acum += num) / this.statistics.totalAverageVotes.length).toFixed(2)

            this.statistics.least_loyals = this.findArray(this.statistics.total, "votes_against_party_pct")
            this.statistics.most_loyals = this.findArray(this.statistics.total, "votes_with_party_pct")

            this.statistics.least_engaged = this.findArray(this.statistics.total, "missed_votes_pct")
            this.statistics.most_engaged = this.findArray(this.statistics.total, "missed_votes_pct", true)
        },
        getAverageVotes(partyArray, criteria) {
            return partyArray.reduce((acumulador, member) => {
                return acumulador += member[criteria]
            }, 0) / (partyArray.length)
        },
        findArray(membersArray, criteria, engagement) {
            membersArray = membersArray.sort(ordenar(criteria)).filter(member => member.total_votes > 0)
            let posicionCorte = Math.ceil(membersArray.length * 0.10)
            let valorCorte = membersArray[membersArray.length - posicionCorte][criteria]

            if (engagement) {
                valorCorte = membersArray[posicionCorte - 1][criteria]
                return membersArray.filter(member => member[criteria] <= valorCorte)
            }

            return membersArray.filter(member => member[criteria] >= valorCorte)

        },
        selectInfo() {
            this.membersData.sort(function (a, b) {
                if (a.state > b.state) {
                    return 1;
                }
                if (a.state < b.state) {
                    return -1;
                }
                return 0
            })
                .forEach(member => {
                    if (!this.stateArray.some(state => state == member.state)) {
                        this.stateArray.push(member.state.toString());

                    }
                })

        }
    },
    computed: {
        filterTablebyParty() {
            // No hay filtros aplicados
            if (this.partyArray.length == 0 && this.stateID == "Select All") {
                return this.filteredMembers = this.membersData
            }
            // Ambos filtros activados
            if (this.stateID != "Select All" && this.partyArray.length > 0) {
                this.filteredMembers = this.membersData.filter(member => this.partyArray.includes(member.party) && this.stateID == member.state)

                console.log(this.filteredMembers)
                return this.filteredMembers
            }
            // Solamente usando el filtro por Estado
            if (this.stateID != "Select All") {
                this.filteredMembers = this.membersData.filter(member => this.stateID == member.state)
                return this.filteredMembers
            }
            // Solamente usando el filtro por Partido
            if (this.partyArray.length > 0) {
                this.filteredMembers = this.membersData.filter(member => this.partyArray.includes(member.party))
                return this.filteredMembers
            }
        },
        sortTable() {
            if (this.ascendente) {
                this.filteredMembers = this.filteredMembers.sort(ordenar(this.sortCriteria[this.sortCriteria.length - 1]))
                this.ascendente = false
                return this.sortCriteria
            }
            this.ascendente = true
            this.filteredMembers = this.filteredMembers.sort(ordenarB(this.sortCriteria[this.sortCriteria.length - 1]))
            return this.sortCriteria
        },
        noValuesFound() {
            this.empty = (this.filteredMembers.length == 0)
        }
    }
})
app.mount("#app")

function ordenar(criteria) {
    return function (a, b) {
        if (a[criteria] > b[criteria]) {
            return 1;
        }
        if (a[criteria] < b[criteria]) {
            return -1;
        }
        return 0;
    }
}

function ordenarB(criteria) {
    return function (a, b) {
        if (a[criteria] < b[criteria]) {
            return 1;
        }
        if (a[criteria] > b[criteria]) {
            return -1;
        }
        return 0;
    }
}
































//Get the button:
mybutton = document.getElementById("myBtn");
// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function () { scrollFunction() };
function scrollFunction() {
    if (document.body.scrollTop > 900 || document.documentElement.scrollTop > 900) {
        mybutton.style.display = "block";
    } else {
        mybutton.style.display = "none";
    }
}
// When the user clicks on the button, scroll to the top of the document
function topFunction() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}


