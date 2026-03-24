# 📘 Hướng dẫn Setup Nylas Calendar Sync

## Bước 1: Lấy Nylas Credentials

1. Truy cập [Nylas Dashboard](https://dashboard.nylas.com/)
2. Đăng nhập vào account của bạn
3. Tạo Application mới (hoặc dùng app có sẵn)
4. Lấy các thông tin sau:
   - **Client ID**: Từ Application Settings
   - **API Key**: Từ Application Settings → API Keys
   - **Webhook Secret**: Từ Webhooks section (tạo mới nếu chưa có)

## Bước 2: Cấu hình Environment Variables

1. Mở file `.env.local` (hoặc `.env`):
   ```bash
   cd /home/vps/personal-dashboard/dashboard-main
   cp .env.example .env.local  # nếu chưa có .env.local
   nano .env.local
   ```

2. Thêm/cập nhật các biến sau:
   ```env
   # Nylas Configuration
   NYLAS_CLIENT_ID=your_actual_client_id
   NYLAS_API_KEY=your_actual_api_key
   NYLAS_REDIRECT_URI=http://localhost:3055/api/calendar/oauth/callback
   NYLAS_WEBHOOK_SECRET=your_actual_webhook_secret
   ```

3. **Quan trọng**: Nếu deploy production, đổi `NYLAS_REDIRECT_URI` thành URL production:
   ```env
   NYLAS_REDIRECT_URI=https://yourdomain.com/api/calendar/oauth/callback
   ```

## Bước 3: Setup Ny las Application

### 3.1 Configure OAuth Redirect URIs

Trong Nylas Dashboard → Application Settings → OAuth:
- **Development**: Add `http://localhost:3055/api/calendar/oauth/callback`
- **Production**: Add `https://yourdomain.com/api/calendar/oauth/callback`

### 3.2 Enable Calendar Scope

Đảm bảo **Calendar** scope được enable trong Application Settings → Scopes.

### 3.3 Setup Webhooks (Optional - cho real-time sync)

1. Vào Webhooks section
2. Add webhook URL:
   - Development: `https://your-ngrok-url.ngrok.io/api/calendar/webhook`
   - Production: `https://yourdomain.com/api/calendar/webhook`
3. Chọn events: `event.created`, `event.updated`, `event.deleted`
4. Lưu Webhook Secret vào `.env.local`

## Bước 4: Restart Application

```bash
cd /home/vps/personal-dashboard/dashboard-main
npm run dev
```

## Bước 5: Connect Calendar

1. Mở browser: `http://localhost:3055/calendar`
2. Click button **"Connect Google"** hoặc **"Connect Apple"**
3. Hoàn tất OAuth flow (đăng nhập Google/Apple)
4. Sau khi redirect về, bạn sẽ thấy status ✓ Google/Apple

## Bước 6: Sync Events

### Auto-sync
Mọi sự kiện được tạo/sửa/xóa trên web sẽ tự động sync:
- Tạo Task mới với due date → Tự động tạo event trên Google/Apple Calendar
- Tạo Reminder mới → Tự động tạo event
- Edit/Delete → Tự động update/delete

### Manual sync
Nếu muốn sync tất cả events hiện có:
1. Click button **"Sync All"** trên Calendar page
2. Hoặc call API: `POST /api/calendar/sync`

## Troubleshooting

### Issue: "Nylas not configured"
**Nguyên nhân**: Thiếu environment variables  
**Giải pháp**: Kiểm tra `.env.local` có đầy đủ `NYLAS_CLIENT_ID` và `NYLAS_API_KEY`

### Issue: OAuth redirect error
**Nguyên nhân**: Redirect URI không khớp  
**Giải pháp**: 
1. Kiểm tra `NYLAS_REDIRECT_URI` trong `.env.local`
2. Đảm bảo URI này đã được add trong Nylas Dashboard

### Issue: Events không xuất hiện trên Google/Apple Calendar
**Nguyên nhân**: Có thể do permission hoặc calendarId  
**Giải pháp**:
1. Kiểm tra Google Calendar permissions
2. Xem Sync Logs: database table `SyncLog`
3. Nếu cần, thay `calendarId: 'primary'` thành calendar ID cụ thể

### Issue: Prisma type errors trong IDE
**Nguyên nhân**: IDE chưa reload Prisma types  
**Giải pháp**:
```bash
npx prisma generate
# Restart TypeScript server trong VS Code: Cmd+Shift+P → Reload Window
```

## Testing với Ngrok (cho Webhooks)

Nếu muốn test webhooks local:

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3055

# Copy HTTPS URL và add vào Nylas Dashboard webhooks
# Example: https://abc123.ngrok.io/api/calendar/webhook
```

## API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/calendar/oauth?provider=google` | GET | Initiate OAuth |
| `/api/calendar/oauth/callback` | GET | OAuth callback |
| `/api/calendar/connections` | GET | List connections |
| `/api/calendar/sync` | POST | Manual sync all |
| `/api/calendar/webhook` | POST | Receive Nylas webhooks |

## Database Tables

Kiểm tra data sync:

```sql
-- Xem connections
SELECT * FROM CalendarConnection;

-- Xem events đã sync
SELECT * FROM CalendarEvent;

-- Xem sync logs
SELECT * FROM SyncLog ORDER BY createdAt DESC LIMIT 20;
```

## Next Steps

- [ ] Connect Google Calendar
- [ ] Test tạo Task mới → verify trên Google Calendar
- [ ] Test edit Task → verify update trên Google Calendar  
- [ ] (Optional) Setup webhooks cho real-time sync từ Google về
- [ ] (Optional) Add Subscriptions auto-sync

🎉 **Hoàn tất!** Calendar sync đã sẵn sàng sử dụng.
