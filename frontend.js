const grid = document.querySelector('.grid')
const resultTemp = document.getElementById('result-template')
  
for (let i = 0; i < 2; i++) {
    grid.append(resultTemp.content.cloneNode(true))
}