const { test, expect } = require('@playwright/test');

test.describe('完整购物流程 E2E 测试', () => {
  const testUser = {
    username: 'user',
    password: '123456'
  };

  const searchKeyword = '耳机';

  test('登录 → 搜索商品 → 加购 → 结算 → 模拟支付 → 查看订单详情', async ({ page }) => {
    await test.step('1. 访问登录页面并断言 URL', async () => {
      await page.goto('/login');
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByRole('heading', { name: '登录' })).toBeVisible();
    });

    await test.step('2. 填写登录表单并提交', async () => {
      await page.getByPlaceholder('用户名').fill(testUser.username);
      await page.getByPlaceholder('密码').fill(testUser.password);
      await page.getByRole('button', { name: '登录' }).click();

      await page.waitForURL(/\/$/);
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByText('优选商城')).toBeVisible();
    });

    await test.step('3. 进入商品列表页面并搜索商品', async () => {
      await page.goto('/products');
      await expect(page).toHaveURL(/\/products$/);
      await expect(page.getByRole('heading', { name: '商品列表' })).toBeVisible();

      await page.getByPlaceholder('搜索商品').fill(searchKeyword);
      await page.getByRole('button', { name: '搜索' }).click();

      await page.waitForLoadState('networkidle');
      const productCards = page.locator('.product-card');
      const count = await productCards.count();
      expect(count).toBeGreaterThan(0);
    });

    await test.step('4. 进入商品详情页并加入购物车', async () => {
      const firstProduct = page.locator('.product-card').first();
      await firstProduct.click();

      await expect(page).toHaveURL(/\/product\/\d+$/);
      await expect(page.getByRole('button', { name: '加入购物车' })).toBeVisible();

      await page.getByRole('button', { name: '加入购物车' }).click();
      await expect(page.getByText('已加入购物车')).toBeVisible({ timeout: 5000 });
    });

    await test.step('5. 进入购物车页面并结算', async () => {
      await page.goto('/cart');
      await expect(page).toHaveURL(/\/cart$/);
      await expect(page.getByRole('heading', { name: '购物车' })).toBeVisible();

      const cartItems = page.locator('.cart-item');
      await expect(cartItems).toHaveCount(1);

      await page.getByRole('button', { name: '去结算' }).click();
      await expect(page).toHaveURL(/\/checkout$/);
      await expect(page.getByRole('heading', { name: '确认订单' })).toBeVisible();
    });

    await test.step('6. 确认订单信息并提交订单', async () => {
      const addressItems = page.locator('.address-item');
      const addressCount = await addressItems.count();
      expect(addressCount).toBeGreaterThan(0);

      const paymentRadios = page.locator('.el-radio');
      await expect(paymentRadios).toHaveCount(3);

      await page.getByRole('button', { name: '提交订单' }).click();

      await page.waitForURL(/\/order\/\d+$/);
      await expect(page).toHaveURL(/\/order\/\d+$/);
      await expect(page.getByText('订单创建成功')).toBeVisible({ timeout: 5000 });
    });

    await test.step('7. 查看订单详情，断言订单状态为「待支付」', async () => {
      await expect(page.locator('.order-detail')).toBeVisible();
      const statusElement = page.locator('.status');
      await expect(statusElement).toBeVisible();
      await expect(statusElement).toHaveClass(/pending/);
      await expect(statusElement).toHaveText('待支付');
    });

    await test.step('8. 模拟支付，断言订单状态变更为「待发货」', async () => {
      await page.getByRole('button', { name: '立即支付' }).click();

      await expect(page.getByText('支付成功')).toBeVisible({ timeout: 5000 });

      const statusElement = page.locator('.status');
      await expect(statusElement).toBeVisible();
      await expect(statusElement).toHaveClass(/paid/);
      await expect(statusElement).toHaveText('待发货');

      const orderNo = page.locator('.el-card__header span').first();
      await expect(orderNo).toBeVisible();
      const orderNoText = await orderNo.textContent();
      expect(orderNoText).toMatch(/^订单号：/);
    });

    await test.step('9. 进入订单列表，验证订单存在', async () => {
      await page.goto('/orders');
      await expect(page).toHaveURL(/\/orders$/);
      await expect(page.getByRole('heading', { name: '我的订单' })).toBeVisible();

      const orderCards = page.locator('.order-card');
      const orderCount = await orderCards.count();
      expect(orderCount).toBeGreaterThan(0);

      const firstOrderStatus = orderCards.first().locator('.status');
      await expect(firstOrderStatus).toBeVisible();
      await expect(firstOrderStatus).toHaveText('待发货');
    });
  });
});
