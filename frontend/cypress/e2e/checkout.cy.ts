describe('Customer Checkout Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
    // Login as a customer
    cy.get('input[placeholder="Email address"]').type('customer@example.com');
    cy.get('input[placeholder="Password"]').type('password');
    cy.contains('button', 'Sign in').click();
    
    cy.url().should('include', '/customer');
  });

  it('allows adding items to cart and checking out online', () => {
    // Navigate to Catalog
    cy.contains('button', 'Catalog').click();
    
    // Add to Cart
    cy.contains('button', 'Add to Cart').first().click();
    
    // Open Cart
    cy.contains('button', 'Cart').click();
    
    // Proceed to Checkout
    cy.contains('button', 'Proceed to Checkout').click();
    
    // Fill shipping details (if applicable) or verify summary
    cy.contains('Order Summary').should('be.visible');
    
    // Click Checkout / Pay
    cy.contains('button', 'Place Order').click();
    
    // Should show success or redirect to payment gateway (stripe mock)
    // Assuming simple success for now:
    cy.contains('Order placed successfully').should('be.visible');
  });
});
