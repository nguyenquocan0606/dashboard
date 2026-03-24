# 🔔 Setup Nylas Webhook - Hướng dẫn chi tiết

## Cách 1: Qua API (Khuyến nghị - Dễ nhất)

### Bước 1: Chuẩn bị thông tin

Bạn cần:
- `NYLAS_API_KEY`: Đã có trong `.env.local`
- Webhook URL: `https://dashboard.quocan.click/api/calendar/webhook`

### Bước 2: Tạo webhook bằng curl

```bash
curl --request POST \
  --url 'https://api.us.nylas.com/v3/webhooks/' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_NYLAS_API_KEY' \
  --data '{
    "trigger_types": [
      "event.created",
      "event.updated",
      "event.deleted"
    ],
    "description": "Calendar sync webhook",
    "webhook_url": "https://dashboard.quocan.click/api/calendar/webhook"
  }'
```

**Thay `YOUR_NYLAS_API_KEY` bằng API key thật của bạn!**

### Bước 3: Response sẽ có `webhook_secret`

```json
{
  "data": {
    "id": "webhook_id_abc123",
    "webhook_url": "https://dashboard.quocan.click/api/calendar/webhook",
    "trigger_types": ["event.created", "event.updated", "event.deleted"],
    "webhook_secret": "41dD3-nXTUfebYuk81Gr",  ← COPY CÁI NÀY!
    "status": "active"
  }
}
```

### Bước 4: Copy `webhook_secret` vào `.env.local`

```env
NYLAS_WEBHOOK_SECRET=41dD3-nXTUfebYuk81Gr
```

---

## Cách 2: Qua Nylas Dashboard

### Bước 1: Vào Dashboard

1. Truy cập: https://dashboard.nylas.com/
2. Chọn Application của bạn
3. Sidebar trái → **"Notifications"** hoặc **"Webhooks"**

### Bước 2: Create Webhook

1. Click **"Create webhook"**
2. Điền:
   - **Webhook URL**: `https://dashboard.quocan.click/api/calendar/webhook`
   - **Description**: `Calendar sync`
   - **Trigger types**: Chọn:
     - ✅ `event.created`
     - ✅ `event.updated`
     - ✅ `event.deleted`

3. Click **"Create webhook"**

### Bước 3: Verification tự động

Nylas sẽ gửi **GET request** với `challenge` parameter đến:
```
https://dashboard.quocan.click/api/calendar/webhook?challenge=abc123
```

Code đã được update để tự động trả về challenge → Verification thành công!

### Bước 4: Copy Webhook Secret

Sau khi verify, Nylas hiển thị `webhook_secret`. Copy và paste vào `.env.local`:

```env
NYLAS_WEBHOOK_SECRET=your_actual_webhook_secret
```

---

## ✅ Kiểm tra Webhook đã hoạt động

### 1. Check webhook status

```bash
curl --request GET \
  --url 'https://api.us.nylas.com/v3/webhooks/' \
  --header 'Authorization: Bearer YOUR_NYLAS_API_KEY'
```

Bạn sẽ thấy webhook với status `active`.

### 2. Test flow

1. **Restart server** (quan trọng!):
   ```bash
   pm2 restart dashboard
   # hoặc
   npm run dev
   ```

2. **Connect Google Calendar** từ web

3. **Tạo event từ web** → Check Google Calendar có event

4. **Sửa event trên Google Calendar** → Check logs:
   ```bash
   # Check server logs
   pm2 logs dashboard
   
   # Hoặc nếu chạy npm run dev, xem terminal output
   ```

   Bạn sẽ thấy: `📨 Webhook received: event.updated`

5. **Check database**:
   ```sql
   SELECT * FROM SyncLog WHERE action = 'webhook' ORDER BY createdAt DESC LIMIT 5;
   ```

---

## 🔍 Troubleshooting

### Issue: Verification failed

**Nguyên nhân**: Server chưa khởi động hoặc URL không accessible

**Giải pháp**:
1. Đảm bảo server đang chạy: `pm2 status` hoặc check process
2. Test URL trực tiếp: 
   ```bash
   curl https://dashboard.quocan.click/api/calendar/webhook?challenge=test123
   ```
   Should return: `test123`

### Issue: Webhook không nhận notifications

**Kiểm tra**:
1. Webhook status có phải `active` không?
2. Server có đang chạy không?
3. Check Cloudflare Tunnel có online không?

### Issue: "webhook_secret not found"

**Lý do**: Chỉ có sau khi verification thành công

**Giải pháp**: Tạo lại webhook hoặc rotate secret:
```bash
curl --request POST \
  --url 'https://api.us.nylas.com/v3/webhooks/rotate-secret/WEBHOOK_ID' \
  --header 'Authorization: Bearer YOUR_NYLAS_API_KEY'
```

---

## 📊 Event Types chi tiết

| Event Type | Khi nào trigger | Hành động trong code |
|------------|-----------------|----------------------|
| `event.created` | User tạo event mới trên Google/Apple | Chỉ log, không overwrite |
| `event.updated` | User sửa event trên Google/Apple | Chỉ log, không overwrite |
| `event.deleted` | User xóa event trên Google/Apple | Xóa Reminder trên web (Tasks/Subs giữ nguyên) |

---

## ✨ Summary

**Tóm lại bạn cần:**
1. ✅ Tạo webhook qua API hoặc Dashboard
2. ✅ Verification sẽ tự động (code đã handle)
3. ✅ Copy `webhook_secret` vào `.env.local`
4. ✅ Restart server
5. ✅ Test sync!

**Lưu ý**: Webhook chỉ để nhận updates từ Google/Apple → Web. Sync từ Web → Google/Apple đã hoạt động rồi (không cần webhook).

🎉 Sau khi setup xong, bạn có đồng bộ 2 chiều hoàn chỉnh!
