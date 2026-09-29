module.exports = {
  apps: [{
    name: 'cv-portfolio',
    cwd: '/home/ubuntu/projects/cv-site',
    script: 'scripts/serve-portfolio.py',
    interpreter: 'python3',
    args: '--directory frontend/dist --port 18090',
    uid: 'ubuntu',
    gid: 'ubuntu',
    autorestart: true,
    max_restarts: 5,
    restart_delay: 3000,
    max_memory_restart: '150M',
    env: { PYTHONUNBUFFERED: '1' },
  }],
};
