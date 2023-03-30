// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Utility file to interface with Azure Blob Storage
 */

// Azure blob store library
import {
  BlobSASPermissions,
  BlobServiceClient,
  ContainerClient,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { BlobParameters, ContainerName, containerNames, getBlobName } from '@karya/core';
import { Promise as BBPromise } from 'bluebird';
import { promises as fsp } from 'fs';
import { envGetString } from '@karya/misc-utils';

let mainClient: BlobServiceClient;
let rootURL: string;
let sharedKeyCredential: StorageSharedKeyCredential;

export function setupBlobStore(blobStore?: { account: string; key: string }) {
  // Azure blob store account and key
  const account = blobStore?.account ?? envGetString('AZURE_BLOB_ACCOUNT');
  const accountKey = blobStore?.key ?? envGetString('AZURE_BLOB_KEY');

  // Create shared storage credential
  sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);

  // Create blob service client
  rootURL = `https://${account}.blob.core.windows.net`;
  mainClient = new BlobServiceClient(rootURL, sharedKeyCredential);
}

/**
 * Return the container client for the container
 * @param name Name of the container
 */
function getContainerClient(name: ContainerName): ContainerClient {
  return mainClient.getContainerClient(name);
}

/**
 * Create the azure blob containers if there are not already there
 */
export async function createBlobContainers() {
  // Get the list of containers that are already there
  const containerIterator = mainClient.listContainers({ includeMetadata: false }).byPage();
  let presentContainers: string[] = [];
  for await (const page of containerIterator) {
    const names = page.containerItems.map((item) => item.name);
    presentContainers = presentContainers.concat(names);
  }

  // Check containers that need to be created
  const toCreate = containerNames.filter((name) => !presentContainers.includes(name));

  // Create containers that are not there
  if (toCreate.length > 0) {
    await BBPromise.map(toCreate, async (cname: ContainerName) => {
      await mainClient.createContainer(cname);
    });
  }
}

/**
 * Create local folders for each container
 */
export async function createLocalFolders(localFolder: string) {
  await BBPromise.map(containerNames, async (cname: ContainerName) => {
    try {
      await fsp.mkdir(`${localFolder}/${cname}`, { recursive: true });
    } catch (e) {
      // ignore if folder is present
    }
  });
}

/**
 * Extract and return the container name and blob name from a blob URL
 * @param blobURL URL of the blob
 *
 * @returns Object containing the container name and blob name
 */
export function getParts(blobURL: string): { cname: ContainerName; blobName: string; ext: string } {
  if (blobURL.indexOf(rootURL) !== 0) {
    throw Error(`Invalid blob URL ${blobURL}`);
  }

  const blobPath = blobURL.slice(rootURL.length + 1);
  const parts = blobPath.split('/');
  const cname = parts.shift() as ContainerName;
  const blobName = parts.join('/');

  if (!(cname && containerNames.includes(cname))) {
    throw Error(`Invalid blob URL ${blobURL}`);
  }

  const ext = blobName.split('.').pop();

  if (!ext) {
    throw Error(`Invalid blob URL ${blobURL}`);
  }

  return { cname, blobName, ext };
}

/**
 * Check if a blob with given URL exists.
 * @param blobURL URL of the blob
 */
export async function existsBlob(blobURL: string): Promise<boolean> {
  try {
    const { cname, blobName } = getParts(blobURL);
    const containerClient = getContainerClient(cname);
    const blobClient = containerClient.getBlobClient(blobName);
    return blobClient.exists();
  } catch (e) {
    return false;
  }
}

/**
 * Get blob URL for the given blob parameters
 * @param params Parameters of the blob
 */
export function getBlobURL(params: BlobParameters): string {
  const blobName = getBlobName(params);
  const container = getContainerClient(params.cname);
  const blobClient = container.getBlockBlobClient(blobName);
  return blobClient.url;
}

/**
 * Upload a local file into the blob store
 * @param params Parameters of the blob
 * @param filepath Local file path
 */
export async function uploadBlobFromFile(params: BlobParameters, filepath: string): Promise<string> {
  try {
    const blobName = getBlobName(params);
    const container = getContainerClient(params.cname);
    const blobClient = container.getBlockBlobClient(blobName);
    await blobClient.uploadFile(filepath);
    return blobClient.url;
  } catch (e) {
    throw new Error('Failed to upload file.');
  }
}

/**
 * Check if the name is a valid container
 * @param cname Name provided as a string
 */
function isContainerName(cname: string): cname is ContainerName {
  return (containerNames as string[]).includes(cname);
}

/**
 * Upload a file directly using the blob name
 * @param cname Container name
 * @param blobName Blob name
 * @param filepath File path
 */
export async function uploadBlobFromFileWithName(cname: string, blobName: string, filepath: string): Promise<string> {
  // Check if the container name is valid
  if (!isContainerName(cname)) {
    throw new Error('Invalid container name');
  }

  try {
    const container = getContainerClient(cname);
    const blobClient = container.getBlockBlobClient(blobName);
    await blobClient.uploadFile(filepath);
    return blobClient.url;
  } catch (e) {
    throw new Error('Failed to upload file.');
  }
}

/**
 * Replace a blob with a new file
 * @param params Blob parameters
 * @param currentBlobURL Current URL of the blob
 * @param filepath File to replace the blob
 */
export async function replaceBlobWithFile(
  params: BlobParameters,
  currentBlobURL: string,
  filepath: string
): Promise<string> {
  try {
    const { cname, blobName, ext } = getParts(currentBlobURL);
    if (cname !== params.cname) {
      throw new Error('Cannot replace blobs across containers');
    }

    const container = getContainerClient(params.cname);
    let newBlobName = blobName;

    if (ext !== params.ext) {
      await container.deleteBlob(blobName);
      newBlobName = getBlobName(params);
    }

    const blobClient = container.getBlockBlobClient(newBlobName);
    await blobClient.uploadFile(filepath);
    return blobClient.url;
  } catch (e) {
    throw new Error(e.message);
  }
}

export async function downloadBlob(blobURL: string, filepath: string) {
  const { cname, blobName } = getParts(blobURL);
  const container = getContainerClient(cname);
  const blobClient = container.getBlockBlobClient(blobName);
  await blobClient.downloadToFile(filepath, 0);
}

/**
 * Function to download a blob as a string
 * @param blobURL URL of the blob
 */
export async function downloadBlobAsText(blobURL: string): Promise<string> {
  const { cname, blobName } = getParts(blobURL);
  const container = getContainerClient(cname);
  const blobClient = container.getBlockBlobClient(blobName);
  const downloadResponse = await blobClient.download(0);
  if (downloadResponse.readableStreamBody === undefined) {
    throw new Error('Unable to read the blob');
  }
  const data = await streamToString(downloadResponse.readableStreamBody);
  return data;
}

/**
 * Generate a SAS URL for a blob with the given permisssions
 * @param blobURL URL of the blob
 * @param perms 'r' | 'w' indicating the operation to be performed
 * @params age Age of the SAS in minutes
 */
export function getBlobSASURL(blobURL: string, perms: 'r' | 'w', age: number = 30): string {
  const { cname, blobName } = getParts(blobURL);

  // Create the start and expiry time for the URL
  const startsOn = new Date();
  startsOn.setMinutes(startsOn.getMinutes() - 1);
  const expiresOn = new Date();
  expiresOn.setMinutes(startsOn.getMinutes() + age);

  // Generate the SAS query parameters
  const sasQueryParameters = generateBlobSASQueryParameters(
    {
      containerName: cname,
      blobName,
      permissions: BlobSASPermissions.parse(perms),
      startsOn,
      expiresOn,
    },
    sharedKeyCredential
  ).toString();

  // Generate and return the SAS URL
  const sasURL = `${blobURL}?${sasQueryParameters}`;
  return sasURL;
}

/**
 * Helper function to convert downloaded blob to string
 * @param readableStream Readable stream from blob
 */
async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: string[] = [];
    readableStream.on('data', (data) => {
      chunks.push(data.toString());
    });
    readableStream.on('end', () => {
      resolve(chunks.join(''));
    });
    readableStream.on('error', reject);
  });
}
