#!/usr/bin/env bash
set -eu

{
  days=$(( 365 * 3 + 1 ))
  country=JP
  state=Osaka
  locality=Osaka
  organizational=jsx.jp
  unit=Developpers
  common=jsx.jp
  fname=$(echo $common | sed -e 's/\*\.//g')
  subj="/C=$country/ST=$state/L=$locality/O=$organizational/CN=$common"
}

caPrivate() {
  openssl genpkey -out ca.key -algorithm RSA -pkeyopt rsa_keygen_bits:4096
}

caCertificateCreate() {
  openssl req -new -x509 -days $days -subj $subj \
  -key ca.key \
  -out ca.crt
}

serverPrivate() {
  openssl genpkey -out $fname.key -algorithm RSA -pkeyopt rsa_keygen_bits:4096
}

serverCertificateRequest() {
  openssl req -new -subj $subj \
  -key $fname.key \
  -out $fname.csr
}

serverCertificateCreate() {
  serverCertificateRequest
  openssl x509 -req -days $days \
  -in $fname.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out $fname.crt
}

{
  caPrivate
  caCertificateCreate
  serverPrivate
  serverCertificateCreate

  ls -lh *{key,crt}
}

