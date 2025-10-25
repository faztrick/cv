# 🌐 Name Servers - Update at Your Domain Registrar

## ⚠️ IMPORTANT: Update These Name Servers

Go to your domain registrar (GoDaddy, Namecheap, etc.) and update the name servers for each domain:

---

## 📌 bookznow.com

**Update name servers to:**

```
ns1-04.azure-dns.com
ns2-04.azure-dns.net
ns3-04.azure-dns.org
ns4-04.azure-dns.info
```

---

## 📌 faztrick.com

**Update name servers to:**

```
ns1-08.azure-dns.com
ns2-08.azure-dns.net
ns3-08.azure-dns.org
ns4-08.azure-dns.info
```

---

## 📌 fzbiz.com

**Update name servers to:**

```
ns1-03.azure-dns.com
ns2-03.azure-dns.net
ns3-03.azure-dns.org
ns4-03.azure-dns.info
```

---

## 📋 How to Update Name Servers

### **GoDaddy:**

1. Log in to GoDaddy
2. Go to **My Products** → **Domains**
3. Click on the domain → **DNS** → **Nameservers**
4. Select **Change** → **Enter my own nameservers (advanced)**
5. Paste the 4 name servers above
6. Click **Save**

### **Namecheap:**

1. Log in to Namecheap
2. Go to **Domain List**
3. Click **Manage** next to the domain
4. Under **Nameservers**, select **Custom DNS**
5. Enter the 4 name servers above
6. Click the checkmark to save

### **Other Registrars:**

1. Log in to your domain registrar
2. Find **DNS Settings** or **Name Servers**
3. Select **Custom Name Servers**
4. Enter all 4 Azure DNS name servers
5. Save changes

---

## ⏱️ DNS Propagation Time

- **Typical:** 1-4 hours
- **Maximum:** 24-72 hours
- **Check status:** Use <https://www.whatsmydns.net/>

---

## ✅ Verification Commands

After updating name servers, verify with:

```powershell
# Check bookznow.com
nslookup -type=NS bookznow.com

# Check faztrick.com
nslookup -type=NS faztrick.com

# Check fzbiz.com
nslookup -type=NS fzbiz.com
```

---

## 🎯 Next Steps (After DNS Propagation)

1. ✅ Update name servers (you're doing this now)
2. ⏳ Wait for DNS propagation (1-24 hours)
3. ✓ Verify propagation with nslookup
4. ✓ SSL certificates will auto-provision (free)
5. ✓ Your CV will be accessible at all domains!

---

## 📞 Need Help?

- **Azure DNS Docs:** <https://learn.microsoft.com/en-us/azure/dns/>
- **Check DNS Propagation:** <https://www.whatsmydns.net/>
- **DNS Checker:** <https://dnschecker.org/>

---

**Generated:** October 24, 2025
