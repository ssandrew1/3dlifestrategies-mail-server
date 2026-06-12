

pw=$1
node -e "console.log(require('bcryptjs').hashSync('${pw}', 10))"

