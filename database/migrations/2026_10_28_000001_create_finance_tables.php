<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('accounts', function (Blueprint $t) { $t->id(); $t->foreignId('user_id')->constrained()->cascadeOnDelete(); $t->string('name'); $t->string('type'); $t->bigInteger('opening_balance')->default(0); $t->timestamps(); });
        Schema::create('categories', function (Blueprint $t) { $t->id(); $t->foreignId('user_id')->constrained()->cascadeOnDelete(); $t->string('name'); $t->string('color')->default('#28765c'); $t->timestamps(); });
        Schema::create('transactions', function (Blueprint $t) { $t->id(); $t->foreignId('user_id')->constrained()->cascadeOnDelete(); $t->foreignId('account_id')->constrained(); $t->foreignId('destination_id')->nullable()->constrained('accounts'); $t->foreignId('category_id')->nullable()->constrained(); $t->string('type'); $t->string('title'); $t->bigInteger('amount'); $t->date('date'); $t->text('notes')->nullable(); $t->timestamps(); $t->index(['user_id', 'date']); });
        Schema::create('budgets', function (Blueprint $t) { $t->id(); $t->foreignId('user_id')->constrained()->cascadeOnDelete(); $t->foreignId('category_id')->constrained(); $t->bigInteger('amount'); $t->string('month', 7); $t->timestamps(); $t->unique(['user_id','category_id','month']); });
    }
    public function down(): void { foreach (['budgets','transactions','categories','accounts'] as $table) Schema::dropIfExists($table); }
};
