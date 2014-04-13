#!/bin/bash
eval $(gpg-agent --daemon)
function listmessages()
{
  MESSAGES=$(curl -sH "Content-Type: application/json" -H "Accept: application/json" $PGPMESSAGE_URL/messages)
  echo $MESSAGES | grep -Po '"id":.*?[^\\]",' | awk '/id/ { split($1,a,":"); print a[2]}' | grep -Po '[a-z0-9]+'

}
function readmessage()
{
  echo -ne $(curl -sH "Content-Type: application/json" -H "Accept: application/json" $PGPMESSAGE_URL/messages/$1 | grep -o  "\-\-\-\-\-.*\-\-\-\-\-") | gpg -d
}
function deletemessage()
{
  curl -i -sH "Content-Type: application/json" -H "Accept: application/json" -X DELETE $PGPMESSAGE_URL/messages/$1
}
