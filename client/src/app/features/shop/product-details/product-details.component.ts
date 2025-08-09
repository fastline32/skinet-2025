import { Component, inject, OnInit } from '@angular/core';
import { ShopService } from '../../../core/services/shop.service';
import { ActivatedRoute } from '@angular/router';
import { Product } from '../../../shared/models/product';
import { CurrencyPipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatDivider } from '@angular/material/divider';
import { CartService } from '../../../core/services/cart.service';
import { FormsModule } from '@angular/forms';
import { IsAdminDirective } from '../../../shared/directives/is-admin.directive';
import { MatDialog } from '@angular/material/dialog';
import { ProductFormComponent } from '../../admin/product-form/product-form.component';
import { AdminService } from '../../../core/services/admin.service';
import { firstValueFrom } from 'rxjs';
import { SnackbarService } from '../../../core/services/snackbar.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [
    CurrencyPipe,
    MatButton,
    MatIcon,
    MatFormField,
    MatInput,
    MatLabel,
    MatDivider,
    FormsModule,
    IsAdminDirective
  ],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss'
})
export class ProductDetailsComponent implements OnInit {
  private shopService = inject(ShopService);
  private activatedRoute = inject(ActivatedRoute);
  private cartService = inject(CartService);
  private dialog = inject(MatDialog);
  private adminService = inject(AdminService);
  private snack = inject(SnackbarService);
  products: Product[] = [];
  product?: Product;
  quantityInCart = 0;
  quantity = 1;

  actions = [
    {
      label: 'Edit',
      icon: 'edit',
      tooltip: 'Edit product',
      color: 'accent',
      action: (row: any) => {
        this.openEditDialog(row)
      }
    },
  ]

  ngOnInit(): void {
    this.loadProduct();
  }

  loadProduct() {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if(!id) return;
    this.shopService.getProduct(+id).subscribe({
      next: product => {
        this.product = product;
        this.updateQuantityInCart(); 
      },
      error: error => console.log(error)
    });
  }

  updateCart() {
    if (!this.product) return;

    if (this.quantity > this.quantityInCart) {
      if(this.product.quantityInStock >= this.quantity){
      const itemsToAdd = this.quantity - this.quantityInCart;
      this.quantityInCart += itemsToAdd;
      this.cartService.addItemToCart(this.product, itemsToAdd)
      } else {
        this.snack.error('Not enough quantity in stock')
      }
    } else {
      const itemsToRemove = this.quantityInCart - this.quantity;
      this.quantityInCart -= itemsToRemove;
      this.cartService.removeItemFromCart(this.product.id,itemsToRemove);
    }
  }

  updateQuantityInCart() {
    this.quantityInCart = this.cartService.cart()?.items.find(x => x.productId === this.product?.id)?.quantity || 0;
    this.quantity = this.quantityInCart || 1;
  }

  getButtonText() {
    return this.quantityInCart > 0 ? 'Update cart' : 'Add to cart';
  }

  openEditDialog(product: Product) {
      const dialog = this.dialog.open(ProductFormComponent, {
        minWidth: '500px',
        data: {
          title: 'Edit Product',
          product
        }
      })
      dialog.afterClosed().subscribe({
        next: async result => {
          if(result) {
            await firstValueFrom(this.adminService.updateProduct(result.product));
            const index = this.products.findIndex(p => p.id === result.product.id);
            if(index !== -1) {
              this.products[index] = result.product;
            }
          }
        }
      })
    }
}
