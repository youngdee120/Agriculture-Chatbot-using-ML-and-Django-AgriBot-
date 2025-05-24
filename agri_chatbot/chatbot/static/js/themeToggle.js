document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('themeToggle');
    const icon = toggle.querySelector('i');
    const stored = localStorage.getItem('theme') || 'light';
    document.documentElement.classList.remove('light', 'dark');
    document.body.classList.remove('light', 'dark');
    document.documentElement.classList.add(stored);
    document.body.classList.add(stored);
    icon.className = stored === 'dark' ? 'bx bx-sun' : 'bx bx-moon';
  
    toggle.addEventListener('click', () => {
      const isDark = !document.documentElement.classList.contains('dark');
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.classList.toggle('light', !isDark);
      document.body.classList.toggle('dark', isDark);
      document.body.classList.toggle('light', !isDark);
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      icon.className = isDark ? 'bx bx-sun' : 'bx bx-moon';
    });
  });
  