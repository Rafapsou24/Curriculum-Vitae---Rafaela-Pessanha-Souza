async function loadingComponent(id, file) {
    const el = document.getElementById(id);
    if (!el) return;

    const res = await fetch(file);
    el.innerHTML = await res.text();
}

loadingComponent('header', 'assets/pages/layout/header.html');
loadingComponent('footer', 'assets/pages/layout/footer.html');

// Download
async function baixarPDF() {
    const elemento = document.getElementById('cv-content');
    if (!elemento) return alert('Elemento #cv-content não encontrado');

    // ===== 1. CLONE COM LAYOUT INLINE (imune ao Tailwind) =====
    const clonado = elemento.cloneNode(true);

    clonado.style.cssText = `
    width: 210mm !important;
    max-width: 310mm !important;
    min-height: 297mm !important;
    margin: 0 auto !important;
    padding: 8mm !important;
    background: #f3f4f6 !important;
    box-sizing: border-box !important;
    font-size: 5px !important;
    font-family: 'Inter', sans-serif !important;
  `;

    // ===== GRID: 2 colunas com alturas iguais =====
    const grid = clonado.querySelector('div.grid');
    if (grid) {
        grid.style.cssText = `
      display: grid !important;
      grid-template-columns: 50% 60% !important;
      gap: 8px !important;
      align-items: stretch !important;
    `;
    }

    // ===== SIDEBAR: flex-column, ocupa 100% da altura =====
    const aside = clonado.querySelector('aside');
    if (aside) {
        aside.style.cssText = `
      grid-column: 1 / 2 !important;
      width: 100% !important;
      display: flex !important;
      flex-direction: column !important;
      padding-left: 20px !important;
    `;

        const asideInner = aside.querySelector(':scope > div');
        if (asideInner) {
            asideInner.style.cssText = `
        flex: 1 !important;
        height: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        margin-left: 10px !important;
      `;

            // Empurra o último bloco (Centres d'intérêt) pro final do sidebar
            const lastSection = asideInner.querySelector('section:last-of-type');
            if (lastSection) {
                lastSection.style.marginTop = 'auto';
            }
        }
    }

    // ===== COLUNA DIREITA: flex-column, ocupa 100% da altura =====
    const col2 = clonado.querySelector('.lg\\:col-span-2');
    if (col2) {
        col2.style.cssText = `
      grid-column: 2 / 3 !important;
      width: 100% !important;
      display: flex !important;
      flex-direction: column !important;
    `;

        const col2Inner = col2.querySelector('article');
        if (col2Inner) {
            col2Inner.style.cssText = `
        flex: 1 !important;
        height: 100% !important;
      `;
        }
    }

    // ===== TIPOGRAFIA COMPACTA =====
    clonado.querySelectorAll('h1').forEach(el => el.style.fontSize = '15px');
    clonado.querySelectorAll('h2').forEach(el => el.style.fontSize = '11px');
    clonado.querySelectorAll('h3').forEach(el => el.style.fontSize = '12px');
    clonado.querySelectorAll('p, li').forEach(el => {
        el.style.fontSize = '11px';
        el.style.lineHeight = '1.3';
    });

    // ===== 2. RENDERIZA FORA DA TELA =====
    clonado.style.position = 'fixed';
    clonado.style.left = '-99999px';
    clonado.style.top = '0';
    clonado.style.zIndex = '-1';
    document.body.appendChild(clonado);

    // Dá um tempo pro navegador aplicar o layout
    await new Promise(r => setTimeout(r, 300));

    try {
        // ===== 3. CAPTURA O CLONE =====
        const canvas = await html2canvas(clonado, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#f3f4f6',
            logging: false,
            width: clonado.scrollWidth,
            height: clonado.scrollHeight,
            windowWidth: clonado.scrollWidth,
            windowHeight: clonado.scrollHeight
        });

        // ===== 4. GERA O PDF =====
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');

        const pageWidth = 200;
        const pageHeight = 297;
        const margin = 0;

        const usableWidth = pageWidth - margin * 2;
        const usableHeight = pageHeight - margin * 2;

        const canvasRatio = canvas.height / canvas.width;

        let finalWidth = usableWidth;
        let finalHeight = finalWidth * canvasRatio;

        if (finalHeight > usableHeight) {
            finalHeight = usableHeight;
            finalWidth = finalHeight / canvasRatio;
        }

        const xOffset = (pageWidth - finalWidth) / 2;
        const yOffset = 0;

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);

        pdf.save('CV-Rafaela-Pessanha-Souza.pdf');
        console.log('✅ PDF gerado');
    } catch (e) {
        console.error('❌ Error:', e);
        alert('Erro: ' + e.message);
    } finally {
        // ===== 5. LIMPA O CLONE =====
        document.body.removeChild(clonado);
    }

    const sidebarInner = clonado.querySelector('aside > div');

    if (sidebarInner) {
        // Reduz a margem esquerda de TODAS as listas do sidebar
        sidebarInner.querySelectorAll('ul').forEach(ul => {
            ul.style.marginLeft = '6px';   // ← era ml-6 (24px) e ml-10 (40px)
            ul.style.paddingLeft = '0';
        });

        // Reduz o espaçamento interno dos spans (ex: JavaScript - Tailwind)
        sidebarInner.querySelectorAll('span.ml-6, span.ml-4').forEach(span => {
            span.style.marginLeft = '12px'; // ← era 24px ou 16px
        });

        // Reduz o padding do card vermelho
        sidebarInner.style.padding = '16px'; // ← era p-6 (24px)
    }
}

window.addEventListener('load', () => {
    const btn = document.getElementById('btn-baixar-pdf');
    if (btn) btn.addEventListener('click', baixarPDF);
});