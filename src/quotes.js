const quotes = [
  {
    text: "Ask not what your country can do for you. Ask what you can do for your country.",
    attribution: "John F. Kennedy",
  },
  {
    text: "The arc of the moral universe is long, but it bends toward justice.",
    attribution: "Martin Luther King Jr.",
  },
  {
    text: "Democracy is not a spectator sport.",
    attribution: "Marian Wright Edelman",
  },
  {
    text: "Government of the people, by the people, for the people, shall not perish from the earth.",
    attribution: "Abraham Lincoln",
  },
];

const quote = quotes[Math.floor(Math.random() * quotes.length)];
document.querySelector(".quote-text").textContent = `\u201c${quote.text}\u201d`;
document.querySelector(".quote-attribution").textContent = `\u2014 ${quote.attribution}`;
