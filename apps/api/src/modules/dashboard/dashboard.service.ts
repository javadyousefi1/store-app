import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getSummary() {
    const [revenue, pending, ordersToday, totalUsers, activeProducts, lowStockCount] =
      await Promise.all([
        this.dataSource.query<[{ revenue: string }]>(
          `SELECT COALESCE(SUM("totalAmount"), 0) AS revenue
           FROM orders
           WHERE status = 'confirmed'
             AND "createdAt" >= date_trunc('month', NOW())
             AND "deletedAt" IS NULL`,
        ),
        this.dataSource.query<[{ count: string }]>(
          `SELECT COUNT(*) AS count FROM orders
           WHERE status = 'payment_uploaded' AND "deletedAt" IS NULL`,
        ),
        this.dataSource.query<[{ count: string }]>(
          `SELECT COUNT(*) AS count FROM orders
           WHERE "createdAt"::date = CURRENT_DATE AND "deletedAt" IS NULL`,
        ),
        this.dataSource.query<[{ count: string }]>(
          `SELECT COUNT(*) AS count FROM users WHERE "deletedAt" IS NULL`,
        ),
        this.dataSource.query<[{ count: string }]>(
          `SELECT COUNT(*) AS count FROM products
           WHERE "isActive" = true AND "deletedAt" IS NULL`,
        ),
        this.dataSource.query<[{ count: string }]>(
          `SELECT COUNT(*) AS count FROM product_variants
           WHERE (stock - reserved) < 5 AND "deletedAt" IS NULL`,
        ),
      ]);

    return {
      revenueThisMonth: Number(revenue[0].revenue),
      pendingPaymentOrders: Number(pending[0].count),
      ordersToday: Number(ordersToday[0].count),
      totalUsers: Number(totalUsers[0].count),
      activeProducts: Number(activeProducts[0].count),
      lowStockCount: Number(lowStockCount[0].count),
    };
  }

  async getRevenueChart(days = 30) {
    const rows = await this.dataSource.query<
      { day: string; revenue: string; orders: string }[]
    >(
      `SELECT
         to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
         COALESCE(SUM("totalAmount"), 0)                        AS revenue,
         COUNT(*)                                               AS orders
       FROM orders
       WHERE status = 'confirmed'
         AND "createdAt" >= NOW() - ($1 || ' days')::interval
         AND "deletedAt" IS NULL
       GROUP BY date_trunc('day', "createdAt")
       ORDER BY day`,
      [days],
    );

    return rows.map((r) => ({
      date: r.day,
      revenue: Number(r.revenue),
      orders: Number(r.orders),
    }));
  }

  async getOrdersByStatus() {
    const rows = await this.dataSource.query<{ status: string; count: string }[]>(
      `SELECT status, COUNT(*) AS count
       FROM orders
       WHERE "deletedAt" IS NULL
       GROUP BY status`,
    );

    return rows.map((r) => ({ status: r.status, count: Number(r.count) }));
  }

  async getTopProducts(limit = 10) {
    const rows = await this.dataSource.query<
      { productName: string; revenue: string; unitsSold: string }[]
    >(
      `SELECT
         oi."productName",
         SUM(oi.price * oi.quantity) AS revenue,
         SUM(oi.quantity)             AS "unitsSold"
       FROM order_items oi
       JOIN orders o ON o.id = oi."orderId"
       WHERE o.status = 'confirmed' AND o."deletedAt" IS NULL
       GROUP BY oi."productName"
       ORDER BY revenue DESC
       LIMIT $1`,
      [limit],
    );

    return rows.map((r) => ({
      productName: r.productName,
      revenue: Number(r.revenue),
      unitsSold: Number(r.unitsSold),
    }));
  }

  async getNewUsersChart(days = 30) {
    const rows = await this.dataSource.query<{ day: string; count: string }[]>(
      `SELECT
         to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
         COUNT(*) AS count
       FROM users
       WHERE "createdAt" >= NOW() - ($1 || ' days')::interval
         AND "deletedAt" IS NULL
       GROUP BY date_trunc('day', "createdAt")
       ORDER BY day`,
      [days],
    );

    return rows.map((r) => ({ date: r.day, count: Number(r.count) }));
  }

  async getRecentOrders(limit = 10) {
    const rows = await this.dataSource.query<
      {
        id: string;
        firstName: string;
        lastName: string;
        totalAmount: string;
        status: string;
        createdAt: string;
        itemCount: string;
      }[]
    >(
      `SELECT
         o.id,
         o."firstName",
         o."lastName",
         o."totalAmount",
         o.status,
         o."createdAt",
         COUNT(oi.id) AS "itemCount"
       FROM orders o
       LEFT JOIN order_items oi ON oi."orderId" = o.id
       WHERE o."deletedAt" IS NULL
       GROUP BY o.id
       ORDER BY o."createdAt" DESC
       LIMIT $1`,
      [limit],
    );

    return rows.map((r) => ({
      id: r.id,
      customerName: `${r.firstName} ${r.lastName}`,
      totalAmount: Number(r.totalAmount),
      status: r.status,
      itemCount: Number(r.itemCount),
      createdAt: r.createdAt,
    }));
  }

  async getLowStockVariants(threshold = 5, limit = 20) {
    const rows = await this.dataSource.query<
      {
        sku: string;
        stock: number;
        reserved: number;
        attributes: Record<string, string>;
        productName: string;
      }[]
    >(
      `SELECT
         pv.sku,
         pv.stock,
         pv.reserved,
         pv.attributes,
         p.name AS "productName"
       FROM product_variants pv
       JOIN products p ON p.id = pv."productId"
       WHERE (pv.stock - pv.reserved) < $1
         AND pv."deletedAt" IS NULL
         AND p."deletedAt" IS NULL
       ORDER BY (pv.stock - pv.reserved) ASC
       LIMIT $2`,
      [threshold, limit],
    );

    return rows.map((r) => ({
      sku: r.sku,
      productName: r.productName,
      stock: r.stock,
      reserved: r.reserved,
      available: r.stock - r.reserved,
      attributes: r.attributes ?? {},
    }));
  }

  async getAll() {
    const [summary, revenueChart, ordersByStatus, topProducts, newUsersChart, recentOrders, lowStockVariants] =
      await Promise.all([
        this.getSummary(),
        this.getRevenueChart(30),
        this.getOrdersByStatus(),
        this.getTopProducts(10),
        this.getNewUsersChart(30),
        this.getRecentOrders(10),
        this.getLowStockVariants(5, 20),
      ]);

    return {
      summary,
      revenueChart,
      ordersByStatus,
      topProducts,
      newUsersChart,
      recentOrders,
      lowStockVariants,
    };
  }
}
