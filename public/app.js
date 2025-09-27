async function getStock() {
  const symbol = document.getElementById("symbolInput").value;
  if (!symbol) return alert("Enter a stock symbol");

  const res = await fetch(`/api/stock/${symbol}`);
  const data = await res.json();
  document.getElementById("output").textContent = JSON.stringify(data, null, 2);
}
