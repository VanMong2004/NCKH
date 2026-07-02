<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Messages\MailMessage;


use App\Models\Address;
use App\Models\Cart;
use App\Models\Order;
use App\Models\Review;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'mssv',
        'role',
        'avatar',
        'locked_at',
    ];

    protected $appends = [
        'avatar_url'
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'deleted_at' => 'datetime',
        'locked_at' => 'datetime',
    ];

    // RELATIONSHIPS

    public function addresses()
    {
        return $this->hasMany(Address::class);
    }

    public function cart()
    {
        return $this->hasOne(Cart::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function notifications()
    {
        return $this->hasMany(
            Notification::class
        );
    }

    public function chatHistories()
    {
        return $this->hasMany(
            ChatHistory::class
        );
    }

    public function searchHistories()
    {
        return $this->hasMany(
            SearchHistory::class
        );
    }

    //helpers
    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function sendPasswordResetNotification($token): void
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

        $resetUrl = $frontendUrl
            . '/reset-password?token=' . $token
            . '&email=' . urlencode($this->email);

        $this->notify(new class($resetUrl) extends \Illuminate\Notifications\Notification {
            public function __construct(private string $resetUrl)
            {
            }

            public function via($notifiable): array
            {
                return ['mail'];
            }

            public function toMail($notifiable): MailMessage
            {
                return (new MailMessage)
                    ->subject('Đặt lại mật khẩu')
                    ->line('Bạn nhận được email này vì có yêu cầu đặt lại mật khẩu cho tài khoản của bạn.')
                    ->action('Đặt lại mật khẩu', $this->resetUrl)
                    ->line('Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.');
            }
        });
    }

    public function getAvatarUrlAttribute(): ?string
    {
        if (!$this->avatar) {
            return file_exists(public_path('images/users/default_avatar.png'))
                ? asset('images/users/default_avatar.png')
                : null;
        }

        if (
            str_starts_with($this->avatar, 'http://') ||
            str_starts_with($this->avatar, 'https://')
        ) {
            return $this->avatar;
        }

        return asset(ltrim($this->avatar, '/'));
    }
}
