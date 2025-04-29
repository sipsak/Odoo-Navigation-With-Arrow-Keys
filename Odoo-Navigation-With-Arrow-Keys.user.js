// ==UserScript==
// @name            Odoo Navigation With Arrow Keys
// @name:tr         Odoo Ok Tuşları İle Navigasyon
// @namespace       https://github.com/sipsak
// @version         1.1
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

        // Hücreye geçince input elementini bul ve tüm metni seç
        setTimeout(function() {
            const input = cell.querySelector('input, textarea, select');
            if (input && (input.tagName.toLowerCase() === 'input' || input.tagName.toLowerCase() === 'textarea')) {
                input.focus();
                input.select();
            }
        }, 150);
    }

    function isEditable(cell) {
        return cell.querySelector('input, textarea, select') !== null;
    }

    function getActiveInputElement() {
        const active = document.activeElement;
        if (['input', 'textarea', 'select'].includes(active.tagName.toLowerCase())) {
            return active;
        }

        // Eğer TD içindeki bir input element aktifse
        const cell = active.closest('td');
        if (cell) {
            const input = cell.querySelector('input, textarea, select');
            if (input) return input;
        }

        return null;
    }

    function isAtStartOfInput(element) {
        if (!element || typeof element.selectionStart !== 'number') return true;
        return element.selectionStart === 0;
    }

    function isAtEndOfInput(element) {
        if (!element || typeof element.selectionEnd !== 'number' || typeof element.value !== 'string') return true;
        return element.selectionEnd === element.value.length;
    }

    function isAllTextSelected(element) {
        if (!element || typeof element.selectionStart !== 'number' || typeof element.selectionEnd !== 'number' || typeof element.value !== 'string') return false;
        return element.selectionStart === 0 && element.selectionEnd === element.value.length;
    }

    function isInputEmpty(element) {
        if (!element || typeof element.value !== 'string') return true;
        return element.value.trim() === '';
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

        const inputElement = getActiveInputElement();

        // Eğer aktif bir input elementi varsa
        if (inputElement) {
            // Input boşsa, doğrudan hücreler arası geçişe izin ver
            if (isInputEmpty(inputElement)) {
                // Boş input olduğu için tüm oklar diğer hücreye geçiş yapabilir
                // Devam edelim - yani bu if bloğundan çıkıp aşağıdaki koda gidelim
            }
            // Tüm metin seçiliyse ve sol/sağ oka basıldıysa
            else if (isAllTextSelected(inputElement)) {
                if (e.key === 'ArrowLeft') {
                    // Sol ok tuşu - imleci en başa getir
                    e.preventDefault();
                    inputElement.setSelectionRange(0, 0);
                    return;
                }
                if (e.key === 'ArrowRight') {
                    // Sağ ok tuşu - imleci en sona getir
                    e.preventDefault();
                    inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
                    return;
                }
            }
            // Normal imleç kontrolü (boş değil ve metin seçili değilse)
            else {
                if (e.key === 'ArrowLeft' && !isAtStartOfInput(inputElement)) {
                    return; // İmleç başta değilse, normal imleç hareketi olsun
                }
                if (e.key === 'ArrowRight' && !isAtEndOfInput(inputElement)) {
                    return; // İmleç sonda değilse, normal imleç hareketi olsun
                }
            }
        }

        // TD elementini bul
        let cell;
        if (inputElement) {
            // Input elementinden üst TD'ye git
            cell = inputElement.closest('td');
        } else {
            // Doğrudan hedef elementten TD'yi bul
            cell = e.target.closest('td');
        }

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
