<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesPerformance extends Model
{
    use HasFactory;

    protected $fillable = [
        'salesperson_name',
        'region',
        'month',
        'target_amount',
        'actual_sales',
        'transaction_count',
    ];

    protected $casts = [
        'target_amount' => 'decimal:2',
        'actual_sales' => 'decimal:2',
    ];

    /**
     * Determine if this performance triggers an exception report.
     * As referenced in Chapter 2 (Bab II): Sales below $10,000 or above $50,000.
     */
    public function isException(): bool
    {
        return $this->actual_sales < 10000 || $this->actual_sales > 50000;
    }

    public function getExceptionType(): ?string
    {
        if ($this->actual_sales < 10000) {
            return 'Underperforming ( < $10.000 )';
        }
        if ($this->actual_sales > 50000) {
            return 'High Outlier ( > $50.000 )';
        }

        return null;
    }
}
