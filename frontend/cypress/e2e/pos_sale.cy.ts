describe('POS Sale Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
    // Login as a pharmacist
    cy.get('input[placeholder="Email address"]').type('pharmacist@example.com');
    cy.get('input[placeholder="Password"]').type('password');
    cy.contains('button', 'Sign in').click();
    
    // We should be redirected to the pharmacist dashboard
    cy.url().should('include', '/pharmacist');
  });

  it('allows adding items to cart and completing a POS sale', () => {
    // Wait for drugs to load (mocking the network response would be better for pure E2E without relying on DB state)
    // For now, we assume at least one drug exists.
    
    // Search for a drug or click the first "Add to Cart" button
    cy.get('button').contains('Add to Cart').first().click();
    
    // Check if cart updated
    cy.contains('Item(s) added').should('exist');
    
    // Open Cart modal or navigate to cart section
    cy.get('button').contains('Cart').click();
    
    // Select payment method
    cy.get('select[name="payment_method"]').select('cash');
    
    // Enter amount tendered
    cy.get('input[name="amount_tendered"]').type('1000');
    
    // Complete Sale
    cy.contains('button', 'Complete Sale').click();
    
    // Verify success message
    cy.contains('Sale completed successfully').should('be.visible');
  });
});
