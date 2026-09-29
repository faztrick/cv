module.exports = {
  apps: [{
    name: 'cv-portfolio-tunnel',
    cwd: '/home/ubuntu/projects/cv-site',
    script: '/usr/local/bin/cloudflared',
    interpreter: 'none',
    args: 'tunnel --config /home/ubuntu/projects/cv-site/deploy/cloudflare.yml run',
    uid: 'ubuntu',
    gid: 'ubuntu',
    autorestart: true,
    max_restarts: 5,
    restart_delay: 5000,
  }],
};
