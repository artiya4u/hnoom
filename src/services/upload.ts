export default async function uploadFileToIPFS(source: string): Promise<any> {
  console.log(`Uploading: ${source}`)
  let formData = new FormData();
  formData.append("file", {
      uri: source, name: 'file', type: 'application/binary'
    }
  );

  let response = await fetch("https://ipfs.infura.io:5001/api/v0/add?pin=true", {
    method: 'POST',
    body: formData,
    redirect: 'follow'
  });
  return await response.json();
}
