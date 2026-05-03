require('dotenv').config();
const express = require('express');
const app = express();
const fs = require('fs').promises;
const fsSync = require('fs');
const https = require('https');
const cors = require('cors');
const path = require("path");
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');

// Azure Blob Storage setup (optional — falls back to local disk when not configured)
const AZURE_STORAGE_ACCOUNT = process.env.AZURE_STORAGE_ACCOUNT;
const AZURE_STORAGE_KEY = process.env.AZURE_STORAGE_KEY;
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_STORAGE_CONTAINER = process.env.AZURE_STORAGE_CONTAINER || 'images';

let blobContainerClient = null;

if (AZURE_STORAGE_CONNECTION_STRING) {
  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  blobContainerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER);
  console.log(`Azure Blob Storage connected via connection string (container: ${AZURE_STORAGE_CONTAINER})`);
} else if (AZURE_STORAGE_ACCOUNT && AZURE_STORAGE_KEY) {
  const sharedKeyCredential = new StorageSharedKeyCredential(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_KEY);
  const blobServiceClient = new BlobServiceClient(
    `https://${AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`,
    sharedKeyCredential
  );
  blobContainerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER);
  console.log(`Azure Blob Storage connected via account key (container: ${AZURE_STORAGE_CONTAINER})`);
} else {
  console.log('Azure Blob Storage not configured — using local disk storage');
}

// Middleware
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '30mb' }));
app.use(express.urlencoded({ limit: process.env.MAX_FILE_SIZE || '30mb', extended: true }));
app.use(cors());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

// Static files
app.use(express.static('public'));
app.use('/data', express.static('data'));

// Health check endpoint for Azure
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Image Server API',
    version: '1.0.0',
    endpoints: {
      upload: 'POST /v1/savebese64file',
      gallery: 'GET /showallimg',
      delete: 'DELETE /delete_image/:filename',
      deleteByDate: 'DELETE /delete_images_by_date',
      deleteByUID: 'DELETE /delete_images_by_uid/:uid',
      health: 'GET /health'
    }
  });
});

// Save base64 image file
app.post('/v1/savebese64file', async (req, res) => {
  const { body } = req;
  try {
    const api_key = path.basename(String(body.api_key || ''));
    let filename = path.basename(body.filename ?? "image.jpg");
    const base64Data = body.file ?? "";
    const appDomain = process.env.APP_DOMAIN || 'uaecodes.com';
    const buffer = Buffer.from(base64Data, 'base64');

    console.log(`Filename= ${filename}`);

    let fileUrl;

    if (blobContainerClient) {
      // Upload to Azure Blob Storage
      const blobName = `${api_key}/documents/${filename}`;
      const blockBlobClient = blobContainerClient.getBlockBlobClient(blobName);
      await blockBlobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: { blobContentType: `image/${path.extname(filename).slice(1).toLowerCase() || 'jpeg'}` }
      });
      fileUrl = blockBlobClient.url;
    } else {
      // Fall back to local disk storage
      const basePath = 'data/';
      const userPath = path.join(basePath, api_key);
      const destinationPath = path.join(userPath, 'documents');
      await fs.mkdir(destinationPath, { recursive: true });
      await fs.writeFile(path.join(destinationPath, filename), buffer);

      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const port = process.env.NODE_ENV === 'production' ? '' : ':2211';
      fileUrl = `${protocol}://${appDomain}${port}/${api_key}/documents/${filename}`;
    }

    return res.status(200).json({
      message: "File saved successfully.",
      url: fileUrl
    });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ msg: "Internal server error" });
  }
});

// Show all images with pagination and delete option
app.get('/showallimg', async (req, res) => {
  const folderPath = './data/key/documents';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const sortOrder = req.query.sort || 'desc';

  try {
    let itemsWithStats = [];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

    if (blobContainerClient) {
      // List blobs from Azure Blob Storage
      for await (const blob of blobContainerClient.listBlobsFlat()) {
        const ext = path.extname(blob.name).toLowerCase();
        if (imageExtensions.includes(ext)) {
          const mtime = blob.properties.lastModified || new Date(0);
          itemsWithStats.push({
            item: path.basename(blob.name),
            blobName: blob.name,
            blobUrl: `${blobContainerClient.url}/${blob.name}`,
            mtime,
            size: blob.properties.contentLength || 0,
            formattedDate: mtime.toLocaleDateString(),
            formattedTime: mtime.toLocaleTimeString()
          });
        }
      }
    } else {
      // Fall back to local disk
      try {
        await fs.access(folderPath);
      } catch {
        await fs.mkdir(folderPath, { recursive: true });
      }

      const items = await fs.readdir(folderPath);
      const imageFiles = items.filter(item => imageExtensions.includes(path.extname(item).toLowerCase()));

      const itemsWithStatsPromises = imageFiles.map(async (item) => {
        const filePath = path.join(folderPath, item);
        const stats = await fs.stat(filePath);
        return {
          item,
          blobName: null,
          blobUrl: null,
          mtime: stats.mtime,
          size: stats.size,
          formattedDate: stats.mtime.toLocaleDateString(),
          formattedTime: stats.mtime.toLocaleTimeString()
        };
      });

      itemsWithStats = await Promise.all(itemsWithStatsPromises);
    }

    // Sort by date
    itemsWithStats.sort((a, b) => {
        return sortOrder === 'desc' ? b.mtime.getTime() - a.mtime.getTime() : a.mtime.getTime() - b.mtime.getTime();
    });

    // Pagination
    const totalItems = itemsWithStats.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = itemsWithStats.slice(startIndex, endIndex);

    // Generate HTML
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
    <title>Image Gallery - ${process.env.APP_DOMAIN || 'Image Server'}</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 15px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; }
    .stats { display: flex; justify-content: center; gap: 30px; margin-top: 15px; }
    .stat { text-align: center; }
    .stat-number { font-size: 1.5em; font-weight: bold; }
    .stat-label { font-size: 0.9em; opacity: 0.9; }
    .controls { padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }
    .sort-controls select { padding: 8px 12px; border: 1px solid #ddd; border-radius: 5px; background: white; }
    .pagination-info { color: #666; font-size: 0.9em; }
    .grid-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; padding: 30px; }
    .grid-item { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1); transition: transform 0.3s ease, box-shadow 0.3s ease; }
    .grid-item:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
    .image-container { position: relative; overflow: hidden; }
    .image { width: 100%; height: 150px; object-fit: cover; transition: transform 0.3s ease; }
    .image:hover { transform: scale(1.05); }
    .image-overlay { position: absolute; top: 0; right: 0; background: rgba(0,0,0,0.7); color: white; padding: 5px 10px; border-radius: 0 0 0 10px; }
    .image-info { padding: 15px; }
    .image-name { font-weight: bold; margin-bottom: 8px; color: #333; word-break: break-all; font-size: 0.85em; }
    .image-meta { display: flex; justify-content: space-between; align-items: center; font-size: 0.75em; color: #666; margin-bottom: 10px; }
    .image-actions { display: flex; gap: 10px; }
    .btn { padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block; text-align: center; font-size: 0.85em; transition: all 0.3s ease; }
    .btn-view { background: #007BFF; color: white; }
    .btn-view:hover { background: #0056b3; }
    .btn-delete { background: #dc3545; color: white; }
    .btn-delete:hover { background: #c82333; }
    .pagination { padding: 30px; text-align: center; border-top: 1px solid #eee; }
    .pagination a, .pagination span { display: inline-block; padding: 10px 15px; margin: 0 5px; text-decoration: none; border-radius: 5px; transition: all 0.3s ease; }
    .pagination a { background: #f8f9fa; color: #007BFF; border: 1px solid #dee2e6; }
    .pagination a:hover { background: #007BFF; color: white; }
    .pagination .current { background: #007BFF; color: white; font-weight: bold; }
    .pagination .disabled { background: #f8f9fa; color: #6c757d; cursor: not-allowed; }
    .empty-state { text-align: center; padding: 60px 20px; color: #666; }
    .delete-controls { display: flex; gap: 20px; flex-wrap: wrap; align-items: center; margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 2px solid #e9ecef; }
    @media (max-width: 768px) {
      .controls { flex-direction: column; align-items: stretch; }
      .stats { flex-direction: column; gap: 15px; }
      .grid-container { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); padding: 20px; }
    }
    </style>
    <script>
    function deleteImage(filename) {
      if (confirm('Are you sure you want to delete this image?')) {
        fetch('/delete_image/' + encodeURIComponent(filename), {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
          if (data.message) {
            alert('Image deleted successfully');
            location.reload();
          } else {
            alert('Error deleting image: ' + (data.error || 'Unknown error'));
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Error deleting image');
        });
      }
    }
    function deleteByDateRange() {
      const startDate = document.getElementById('startDate').value;
      const endDate = document.getElementById('endDate').value;

      if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
      }

      if (new Date(startDate) > new Date(endDate)) {
        alert('Start date cannot be after end date');
        return;
      }

      const confirmation = confirm('Are you sure you want to delete all images between ' + startDate + ' and ' + endDate + '?');
      if (confirmation) {
        fetch('/delete_images_by_date', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startDate: startDate, endDate: endDate })
        })
        .then(response => response.json())
        .then(data => {
          if (data.message) {
            alert(data.deletedCount + ' images deleted successfully');
            location.reload();
          } else {
            alert('Error deleting images: ' + (data.error || 'Unknown error'));
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Error deleting images by date range');
        });
      }
    }

    function deleteByUID() {
      const uid = document.getElementById('uidInput').value;

      if (!uid) {
        alert('Please enter a UID');
        return;
      }

      const confirmation = confirm('Are you sure you want to delete all images with UID: ' + uid + '?');
      if (confirmation) {
        fetch('/delete_images_by_uid/' + encodeURIComponent(uid), {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
          if (data.message) {
            alert(data.deletedCount + ' images deleted successfully');
            location.reload();
          } else {
            alert('Error deleting images: ' + (data.error || 'Unknown error'));
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Error deleting images by UID');
        });
      }
    }
    function changeSort() {
      const sortValue = document.getElementById('sortSelect').value;
      const url = new URL(window.location);
      url.searchParams.set('sort', sortValue);
      url.searchParams.set('page', '1');
      window.location.href = url.toString();
    }
    </script>
    </head>
    <body>
    <div class="container">
      <div class="header">
        <h1>📸 Image Gallery</h1>
        <div class="stats">
          <div class="stat">
            <div class="stat-number">${totalItems}</div>
            <div class="stat-label">Total Images</div>
          </div>
          <div class="stat">
            <div class="stat-number">${totalPages}</div>
            <div class="stat-label">Pages</div>
          </div>
          <div class="stat">
            <div class="stat-number">${page}</div>
            <div class="stat-label">Current Page</div>
          </div>
        </div>
      </div>

      <div class="controls">
        <div class="sort-controls">
          <label for="sortSelect">Sort by date: </label>
          <select id="sortSelect" onchange="changeSort()" value="${sortOrder}">
            <option value="desc" ${sortOrder === 'desc' ? 'selected' : ''}>Newest first</option>
            <option value="asc" ${sortOrder === 'asc' ? 'selected' : ''}>Oldest first</option>
          </select>
        </div>
        <div class="pagination-info">
          Showing ${startIndex + 1}-${Math.min(endIndex, totalItems)} of ${totalItems} images
        </div>
      </div>

      <div class="delete-controls">
        <div style="font-weight: bold; color: #495057;">🗑️ Bulk Delete Options:</div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <label for="startDate">From:</label>
          <input type="date" id="startDate" style="padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
          <label for="endDate">To:</label>
          <input type="date" id="endDate" style="padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
          <button onclick="deleteByDateRange()" class="btn" style="background: #dc3545; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer;">🗓️ Delete by Date</button>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <label for="uidInput">UID:</label>
          <input type="text" id="uidInput" placeholder="Enter UID" style="padding: 5px; border: 1px solid #ddd; border-radius: 4px; width: 120px;">
          <button onclick="deleteByUID()" class="btn" style="background: #dc3545; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer;">🆔 Delete by UID</button>
        </div>
      </div>`;

    if (paginatedItems.length === 0) {
      html += `
      <div class="empty-state">
        <div style="font-size: 4em; margin-bottom: 20px;">📷</div>
        <h3>No images found</h3>
        <p>The gallery is empty or no images match your criteria.</p>
      </div>`;
    } else {
      html += '<div class="grid-container">';
      paginatedItems.forEach(({ item, blobUrl, formattedDate, formattedTime, size }) => {
        const uidMatch = item.match(/([a-zA-Z0-9]+)\.(jpg|jpeg|png|gif|bmp|webp)$/i);
        const extractedUID = uidMatch ? uidMatch[1] : 'N/A';
        const fileSizeKB = Math.round(size / 1024);
        const imgSrc = blobUrl || `/data/key/documents/${encodeURIComponent(item)}`;
        const viewHref = blobUrl || `/data/key/documents/${encodeURIComponent(item)}`;
        html += `
        <div class="grid-item">
          <div class="image-container">
            <img class="image" src="${imgSrc}" alt="${item}" loading="lazy">
            <div class="image-overlay">${fileSizeKB} KB</div>
          </div>
          <div class="image-info">
            <div class="image-name">${item}</div>
            <div class="image-uid" style="font-size: 0.75em; color: #007BFF; font-weight: bold; margin-bottom: 5px; padding: 3px 6px; background: #e3f2fd; border-radius: 3px; display: inline-block;">UID: ${extractedUID}</div>
            <div class="image-meta">
              <span>📅 ${formattedDate}</span>
              <span>🕒 ${formattedTime}</span>
            </div>
            <div class="image-actions">
              <a href="${viewHref}" target="_blank" class="btn btn-view">👁️ View</a>
              <button onclick="deleteImage('${item.replace(/'/g, "\\'")}' )" class="btn btn-delete">🗑️ Delete</button>
            </div>
          </div>
        </div>`;
      });
      html += '</div>';
    }

    // Pagination
    if (totalPages > 1) {
      html += '<div class="pagination">';

      // Previous button
      if (page > 1) {
        html += `<a href="?page=${page - 1}&sort=${sortOrder}&limit=${limit}">« Previous</a>`;
      } else {
        html += '<span class="disabled">« Previous</span>';
      }

      // Page numbers
      const maxVisiblePages = 5;
      let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      if (startPage > 1) {
        html += `<a href="?page=1&sort=${sortOrder}&limit=${limit}">1</a>`;
        if (startPage > 2) html += '<span>...</span>';
      }

      for (let i = startPage; i <= endPage; i++) {
        if (i === page) {
          html += `<span class="current">${i}</span>`;
        } else {
          html += `<a href="?page=${i}&sort=${sortOrder}&limit=${limit}">${i}</a>`;
        }
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span>...</span>';
        html += `<a href="?page=${totalPages}&sort=${sortOrder}&limit=${limit}">${totalPages}</a>`;
      }

      // Next button
      if (page < totalPages) {
        html += `<a href="?page=${page + 1}&sort=${sortOrder}&limit=${limit}">Next »</a>`;
      } else {
        html += '<span class="disabled">Next »</span>';
      }

      html += '</div>';
    }

    html += `
    </div>
    </body>
    </html>`;

    res.send(html);
  } catch (err) {
    console.error(`Error reading the folder: ${err}`);
    res.status(500).send('Internal Server Error');
  }
});

// Delete single image
app.delete('/delete_image/:filename', async (req, res) => {
  const folderPath = './data/key/documents';
  const filename = path.basename(req.params.filename);

  try {
    if (blobContainerClient) {
      // Try to find the blob by base filename across all prefixes
      let deleted = false;
      for await (const blob of blobContainerClient.listBlobsFlat()) {
        if (path.basename(blob.name) === filename) {
          await blobContainerClient.getBlockBlobClient(blob.name).delete();
          deleted = true;
          break;
        }
      }
      if (!deleted) {
        return res.status(404).json({ error: 'Image not found' });
      }
    } else {
      const filePath = path.join(folderPath, filename);
      await fs.unlink(filePath);
    }
    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    console.error(`Error deleting file: ${err}`);
    return res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Delete images by date range
app.delete('/delete_images_by_date', async (req, res) => {
  const folderPath = './data/key/documents';
  const { startDate, endDate } = req.body;

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  try {
    let deletedCount = 0;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

    if (blobContainerClient) {
      for await (const blob of blobContainerClient.listBlobsFlat()) {
        const ext = path.extname(blob.name).toLowerCase();
        if (imageExtensions.includes(ext)) {
          const mtime = blob.properties.lastModified || new Date(0);
          if (mtime >= start && mtime <= end) {
            await blobContainerClient.getBlockBlobClient(blob.name).delete();
            deletedCount++;
          }
        }
      }
    } else {
      const items = await fs.readdir(folderPath);
      for (const item of items) {
        const ext = path.extname(item).toLowerCase();
        if (imageExtensions.includes(ext)) {
          const filePath = path.join(folderPath, item);
          const stats = await fs.stat(filePath);
          if (stats.mtime >= start && stats.mtime <= end) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        }
      }
    }

    res.json({ message: 'Images deleted successfully', deletedCount });
  } catch (err) {
    console.error(`Error reading folder: ${err}`);
    return res.status(500).json({ error: 'Failed to read folder' });
  }
});

// Delete images by UID
app.delete('/delete_images_by_uid/:uid', async (req, res) => {
  const folderPath = './data/key/documents';
  const uid = req.params.uid;

  try {
    let deletedCount = 0;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

    if (blobContainerClient) {
      for await (const blob of blobContainerClient.listBlobsFlat()) {
        const ext = path.extname(blob.name).toLowerCase();
        if (imageExtensions.includes(ext)) {
          const uidMatch = path.basename(blob.name).match(/([a-zA-Z0-9]+)\.(jpg|jpeg|png|gif|bmp|webp)$/i);
          const extractedUID = uidMatch ? uidMatch[1] : '';
          if (extractedUID === uid) {
            await blobContainerClient.getBlockBlobClient(blob.name).delete();
            deletedCount++;
          }
        }
      }
    } else {
      const items = await fs.readdir(folderPath);
      for (const item of items) {
        const ext = path.extname(item).toLowerCase();
        if (imageExtensions.includes(ext)) {
          const uidMatch = item.match(/([a-zA-Z0-9]+)\.(jpg|jpeg|png|gif|bmp|webp)$/i);
          const extractedUID = uidMatch ? uidMatch[1] : '';
          if (extractedUID === uid) {
            const filePath = path.join(folderPath, item);
            await fs.unlink(filePath);
            deletedCount++;
          }
        }
      }
    }

    res.json({ message: 'Images deleted successfully', deletedCount });
  } catch (err) {
    console.error(`Error reading folder: ${err}`);
    return res.status(500).json({ error: 'Failed to read folder' });
  }
});

// Start server
const PORT = process.env.PORT || process.env.HTTP_PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Image API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
