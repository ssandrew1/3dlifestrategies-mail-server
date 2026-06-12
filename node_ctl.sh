
cd /home/ssandrew/mail_server

stop_node()
{
# ID=`ps -ef | grep node | grep web_mail | awk '{print $2}'`
ID=`ps -ef | grep node | grep server | awk '{print $2}'`
if [ "${ID}" != "" ];then 
 echo "Killing: "
 ps -ef | grep "${ID}"
 kill -9 $ID
else
 echo "Nothing to kill for node web_mail running"
fi
}

start_node()
{
  echo "Starting support mail"
# node  web_mail_node.js
# nohup node web_mail_node.js > web_mail_node.log 2>&1 &
  nohup node server.js > server.log 2>&1 &
}

if [ "${1}" == "" ];then
  echo "Usage: node_ctl.sh start|stop|restart"
elif [ "${1}" = "start" ];then
  start_node
elif [ "${1}" = "stop" ];then
  stop_node
elif [ "${1}" = "restart" ];then
  stop_node
  start_node
fi

