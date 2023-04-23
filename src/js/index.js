// ("use strict");
import "../styles/main.scss";

const formList = document.querySelector(".form__list");
const form = document.querySelector(".form");
const table = document.querySelector(".table-container");
const resetButton = document.querySelector(".reset-button");

let dataJSON;
let configJSON;

table.style.display = "none";

const getData = async (str) => {
  let data;
  try {
    const res = await fetch(str);
    if (!res.ok) {
      throw new error(res.statusText);
    }
    data = await res.json();
  } catch ({ message }) {
    throw new Error(message);
  }
  return data;
};

const inputDataForm = (formArr) => {
  //где есть минимум -- ипут
  const inputTypes = [
    ...new Set(
      formArr
        .map((selectItem) => {
          if (selectItem.min) return selectItem.type;
        })
        .filter((selectItem) => {
          return selectItem !== undefined;
        })
    ),
  ];
  //где есть шаг, но нет миминимума либо есть ширина, то в селект
  const selectTypes = [
    ...new Set(
      formArr
        .map((selectItem) => {
          if ((selectItem.step && !selectItem.min) || selectItem.width)
            return selectItem.type;
        })
        .filter((selectItem) => {
          return selectItem !== undefined;
        })
    ),
  ];
  //для инпута
  formList.innerHTML += `${inputTypes
    .map((inputItem) => {
      if (inputItem) {
        return `
          ${formArr
            .map((formItem) => {
              if (inputItem === formItem.type && formItem.min) {
                return `
                <li class="form__item list-group-item">
                  <label class="item__label form-label" for="input-${formItem.key}">${formItem.name}: </label>
                  <input class="item__input form-control" name="${formItem.key}" id="input-${formItem.key}" type="number" min="${formItem.min}" max="${formItem.max}" value="${formItem.min}" step="${formItem.step}" required>
                </li>`;
              }
            })
            .join("")}`;
      }
    })
    .join("")}`;
  //для селекта
  formList.innerHTML += `${selectTypes
    .map((selectItem) => {
      if (selectItem) {
        return `
          <li class="form__item list-group-item">
            <label class="item__label form-label" for="select-${selectItem}">${selectItem}:</label>
              <select class="item__select form-select" name="${selectItem}" id="select-${selectItem}" required>
                <option class="item__option" value="">--Пожалуйста, выберите опцию--</option>
                ${formArr
                  .map((formItem) => {
                    if (selectItem === formItem.type) {
                      return `<option value='${JSON.stringify({
                        width: formItem.width,
                        material: formItem.material,
                        step: formItem.step,
                        unit: formItem.unit,
                        price: formItem.price,
                        name: formItem.name,
                      })}'>${formItem.name}</option>`;
                    }
                  })
                  .join("")}
              </select>
          </li>`;
      }
    })
    .join("")}`;
};

const createTable = (cartArr) => {
  document.querySelector(".tbody").innerHTML += `
  <th class="new-item" scope="row">Новый товар</th>
    ${cartArr
      .map((cartItem) => {
        return `
      <tr class="table__row">
      <th class="table__col" scope="row">${cartItem.name}</th>
      <td class="table__col">${cartItem.unit}</td>
      ${
        cartItem.amount
          ? `<td class="table__col">${cartItem.amount}</td>
            <td class="table__col price">${cartItem.price}</td>`
          : `<td class="table__col">${cartItem.square}</td>
            <td class="table__col">${cartItem.price}</td>`
      }
      </tr>
      `;
      })
      .join("")}
    `;

  let resultPrice = Array.prototype.slice
    .call(document.querySelectorAll(".price"))
    .reduce((sum, current) => {
      return sum + +current.innerText;
    }, 0);

  document.querySelector(".table__prie").innerHTML = `
  <p>Итоговая сумма: ${resultPrice}</p>
  `;
};

const calculateMaterial = () => {
  let selectMaterial = JSON.parse(document.querySelector("#select-list").value);
  let selectPipe = JSON.parse(document.querySelector("#select-pipe").value);
  let inputLength = +document.querySelector("#input-length").value;
  let inputWidth = +document.querySelector("#input-width").value;
  let selectFrame = JSON.parse(document.querySelector("#select-frame").value);

  let result = [];

  let square = inputLength * inputWidth; //площадь изделия
  let materialQuantity = Math.ceil(square / selectMaterial.width); //т.к длина листа метр, делем только на ширину. Округляем до большего целого

  // добавляем данные по материалу
  result.push({
    name: selectMaterial.name,
    unit: selectMaterial.unit,
    amount: materialQuantity,
    price: (materialQuantity * selectMaterial.price).toFixed(2),
  });

  // ищем кол-во саморезов на м/2 для выбранного материала
  let screwPerSquare = configJSON.filter((item) => {
    if (item.key == selectMaterial.material && item.value) {
      return item;
    }
  })[0].value;

  let countScrew = Math.ceil(square * screwPerSquare); //кол-во саморезов на всю площадь

  // ищем объект самореза для цены и имени в табличке
  let screw = dataJSON.filter((item) => {
    if (item.type == "fix") {
      return item;
    }
  })[0];

  // добавляем данные по саморезам
  result.push({
    name: screw.name,
    unit: screw.unit,
    amount: countScrew,
    price: (countScrew * screw.price).toFixed(2),
  });

  // находим количество труб через формулу:
  // inputLength = 2*selectPipe.width + selectPipe.width*framesPerLength + (framesPerLength+1)*selectFrame.step

  //кол-во опор по длине изделеия (+ 2 с учётом труб по контуру)
  let framesPerLength =
    Math.ceil(
      ((2 * +selectPipe.width) / 1000 + selectFrame.step - inputLength) /
        -(+selectPipe.width / 1000 + selectFrame.step)
    ) + 2;

  //кол-во опор по ширине изделеия (+ 2 с учётом труб по контуру)
  let framesPerWidth =
    Math.ceil(
      ((2 * +selectPipe.width) / 1000 + selectFrame.step - inputWidth) /
        -(+selectPipe.width / 1000 + selectFrame.step)
    ) + 2;

  let mpPerLength = framesPerLength * inputLength;
  let mpPerWidth = framesPerWidth * inputWidth;

  let resultMp = Math.ceil(mpPerLength + mpPerWidth);

  // добавляем данные по трубам
  result.push({
    name: selectPipe.name,
    unit: selectPipe.unit,
    amount: resultMp,
    price: (resultMp * selectPipe.price).toFixed(2),
  });

  // добавляем данные по площади изделия
  result.push({
    name: "Площадь изделия",
    unit: "м2",
    square: square,
    price: (
      materialQuantity * selectMaterial.price +
      countScrew * screw.price +
      resultMp * selectPipe.price
    ).toFixed(2),
  });

  let squareCell = `${selectFrame.step}x${selectFrame.step}`; //площадь ячейки

  // добавляем данные по площади ячейки
  result.push({
    name: "Площадь ячейки",
    unit: "м2",
    square: squareCell,
    price: "-",
  });

  return result;
};

window.onload = () => {
  getData("../../data/data.json")
    .then((data) => {
      dataJSON = data;
      new Promise((resolve) => {
        resolve(inputDataForm(data));
      }).catch((err) => {
        console.log("Error:", err);
      });
    })
    .catch(({ message }) => console.log("Error:", message));

  getData("../../data/config.json")
    .then((data) => {
      configJSON = data;
      new Promise((resolve) => {
        resolve(inputDataForm(data));
      }).catch((err) => {
        console.log("Error:", err);
      });
    })
    .catch(({ message }) => console.log("Error:", message));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    calculateMaterial();
    new Promise((resolve) => {
      resolve(calculateMaterial());
    })
      .then((result) => {
        createTable(result);
      })
      .catch((err) => {
        console.log("Error:", err);
      });

    table.style.display = "block";
  });

  resetButton.addEventListener("click", () => {
    document.querySelector(".tbody").innerHTML = "";
    document.querySelector(".sum").innerHTML = "";

    table.style.display = "none";
  });
};
