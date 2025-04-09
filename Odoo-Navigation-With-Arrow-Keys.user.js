// ==UserScript==
// @name            Odoo Navigation With Arrow Keys
// @name:tr         Odoo Ok Tuşları İle Navigasyon
// @namespace       https://github.com/sipsak
// @version         1.0
// @description     Allows you to move between cells using arrow keys while in a table in Odoo
// @description:tr  Odoo'da tablo içindeyken ok tuşları ile hücreler arası geçiş yapmayı sağlar
// @author          Burak Şipşak
// @match           https://portal.bskhvac.com.tr/*
// @match           https://*.odoo.com/*
// @grant           none
// @icon            https://raw.githubusercontent.com/sipsak/odoo-image-enlarger/refs/heads/main/icon.png
// @updateURL       https://raw.githubusercontent.com/sipsak/Odoo-Navigation-With-Arrow-Keys/main/Odoo-Navigation-With-Arrow-Keys.user.js
// @downloadURL     https://raw.githubusercontent.com/sipsak/Odoo-Navigation-With-Arrow-Keys/main/Odoo-Navigation-With-Arrow-Keys.user.js
// ==/UserScript==

(function() {
    'use strict';
    function makeCellsFocusable() {
        document.querySelectorAll('table.o_list_table td').forEach(td => {
            if (!td.hasAttribute('tabindex')) td.setAttribute('tabindex', 0);
        });
    }
    function enterEditMode(cell) {
        var event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        cell.dispatchEvent(event);
    }
    function isEditable(cell) {
        return cell.querySelector('input, textarea, select') !== null;
    }
    function navigateCell(e) {
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

        // Shift, Alt veya Ctrl tuşları basılıysa işlem yapma
        if (e.shiftKey || e.altKey || e.ctrlKey) return;

        // Dropdown açıkken hiçbir şey yapma
        const dropdown = document.querySelector('.o-autocomplete--dropdown-menu.show');
        if (dropdown) {
            return;
        }
        const cell = e.target.closest('td');
        if (!cell) return;
        e.preventDefault();
        const row = cell.parentElement;
        const cells = Array.from(row.querySelectorAll('td'));
        const cellIndex = cells.indexOf(cell);
        const table = cell.closest('table.o_list_table');
        if (!table) return;
        const rows = Array.from(table.querySelectorAll('tbody tr')).filter(r => r.querySelectorAll('td').length);
        const rowIndex = rows.indexOf(row);
        let newRowIndex = rowIndex, newCellIndex = cellIndex;
        if (e.key === 'ArrowUp') newRowIndex = rowIndex - 1;
        else if (e.key === 'ArrowDown') newRowIndex = rowIndex + 1;
        else if (e.key === 'ArrowRight') {
            let tempIndex = newCellIndex;
            while (tempIndex < cells.length - 1) {
                tempIndex++;
                if (isEditable(cells[tempIndex])) {
                    newCellIndex = tempIndex;
                    break;
                }
            }
            if (newCellIndex === cellIndex) return;
        }
        else if (e.key === 'ArrowLeft') {
            let tempIndex = newCellIndex;
            while (tempIndex > 0) {
                tempIndex--;
                if (isEditable(cells[tempIndex])) {
                    newCellIndex = tempIndex;
                    break;
                }
            }
            if (newCellIndex === cellIndex) return;
        }
        if (newRowIndex < 0 || newRowIndex >= rows.length) return;
        const newCells = Array.from(rows[newRowIndex].querySelectorAll('td'));
        if (newCellIndex < 0 || newCellIndex >= newCells.length) return;
        const newCell = newCells[newCellIndex];
        newCell.focus();
        setTimeout(function() {
            enterEditMode(newCell);
        }, 100);
    }
    makeCellsFocusable();
    document.addEventListener('keydown', navigateCell, true);
    setInterval(makeCellsFocusable, 1000);
})();
