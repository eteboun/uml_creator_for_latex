import { apiUrls } from "./config.js";

export async function createUml(code) {
  const response = await fetch(apiUrls.createUml, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain"
    },
    body: code
  });  
  
  return response.json();
}

export async function updateUml(configs) {
  const response = await fetch(apiUrls.updateUml, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(configs)
  });

  return response.json();
}

export async function deleteUml(id) {
  const response = await fetch(apiUrls.deleteUml, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ id })
  });

  if (!response.ok) {
    throw new Error(`Delete failed with status ${response.status}`);
  }
}
