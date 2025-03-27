document.addEventListener('DOMContentLoaded', () => {
    const resizers = document.querySelectorAll('.resizer');
  
    resizers.forEach(resizer => {
      resizer.addEventListener('pointerdown', onPointerDown);
    });
  
    function onPointerDown(e) {
      const resizer = e.currentTarget;
      const th = resizer.closest('th');
      if (!th) return;
  
      th.style.transition = 'none';
  
      const startX = e.clientX;
      const startWidth = th.offsetWidth;
  
      resizer.setPointerCapture(e.pointerId);
  
      function onPointerMove(e) {
        const dx = e.clientX - startX;
        const newWidth = startWidth + dx;
        if (newWidth > 50) {
          th.style.width = `${newWidth}px`;
        }
      }
  
      function onPointerUp(e) {
        th.style.transition = 'width 0.1s ease';
        resizer.removeEventListener('pointermove', onPointerMove);
        resizer.removeEventListener('pointerup', onPointerUp);
        resizer.removeEventListener('pointercancel', onPointerUp);
      }
  
      resizer.addEventListener('pointermove', onPointerMove);
      resizer.addEventListener('pointerup', onPointerUp);
      resizer.addEventListener('pointercancel', onPointerUp);
    }
  });