# Asanfa Chess Trainer: proxies the whole site to the app container on
# 127.0.0.1:8012, over plain HTTP: the twin of asanfa.stpl, with the HTTPS
# redirect and Let's Encrypt includes from Hestia's default.tpl. Kept in the
# repository as deploy/hestia/asanfa.tpl; see docs/deployment.md for how to install it.

server {
    listen      %ip%:%proxy_port%;
    server_name %domain_idn% %alias_idn%;
    access_log  /var/log/%web_system%/domains/%domain%.log combined;
    access_log  /var/log/%web_system%/domains/%domain%.bytes bytes;
    error_log   /var/log/%web_system%/domains/%domain%.error.log error;

    include %home%/%user%/conf/web/%domain%/nginx.forcessl.conf*;

    location / {
        proxy_pass http://127.0.0.1:8012;
        proxy_http_version 1.1;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    include %home%/%user%/conf/web/%domain%/nginx.conf_*;
}
