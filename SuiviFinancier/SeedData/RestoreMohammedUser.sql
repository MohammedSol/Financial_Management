-- Script pour recréer l'utilisateur mohammed avec son ID original
-- ID: 647e84dd-0f93-4cee-ba60-177df95bbe5c
-- Email: mohammed@emsi.ma
-- Mot de passe: Admin@123

-- Vérifier si l'utilisateur existe déjà
IF NOT EXISTS (SELECT 1 FROM AspNetUsers WHERE Id = '647e84dd-0f93-4cee-ba60-177df95bbe5c')
BEGIN
    -- Insérer l'utilisateur mohammed
    INSERT INTO AspNetUsers (
        Id, 
        UserName, 
        NormalizedUserName, 
        Email, 
        NormalizedEmail, 
        EmailConfirmed, 
        PasswordHash, 
        SecurityStamp, 
        ConcurrencyStamp,
        PhoneNumberConfirmed,
        TwoFactorEnabled,
        LockoutEnabled,
        AccessFailedCount
    )
    VALUES (
        '647e84dd-0f93-4cee-ba60-177df95bbe5c',
        'mohammed@emsi.ma',
        'MOHAMMED@EMSI.MA',
        'mohammed@emsi.ma',
        'MOHAMMED@EMSI.MA',
        1, -- Email confirmé
        'AQAAAAIAAYagAAAAEKxqH5z3VgXJ8xJz+9qWyF0YHKGxT5N2w7qVjMkL8P4RfE6tBnYxSdCuA9mZkKpQ3g==', -- Hash pour Admin@123
        'ZLQXJ2UPNKTXKTQVVQ5XTXQYY2QVVQXJ',
        '12345678-1234-1234-1234-123456789012',
        0,
        0,
        1,
        0
    );
    
    PRINT 'Utilisateur mohammed créé avec succès !';
    PRINT 'Email: mohammed@emsi.ma';
    PRINT 'Mot de passe: Admin@123';
END
ELSE
BEGIN
    PRINT 'L''utilisateur mohammed existe déjà dans la base de données.';
END
GO

-- Créer des catégories par défaut pour mohammed
IF NOT EXISTS (SELECT 1 FROM Categories WHERE UserId = '647e84dd-0f93-4cee-ba60-177df95bbe5c')
BEGIN
    PRINT 'Création des catégories pour mohammed...';
    
    INSERT INTO Categories (Name, Description, Type, Color, Icon, UserId)
    VALUES 
        ('Salaire', 'Revenu mensuel', 'Revenu', '#28a745', 'bi-cash-coin', '647e84dd-0f93-4cee-ba60-177df95bbe5c'),
        ('Alimentation', 'Courses et restaurants', 'Depense', '#dc3545', 'bi-cart', '647e84dd-0f93-4cee-ba60-177df95bbe5c'),
        ('Transport', 'Essence, taxi, bus', 'Depense', '#ffc107', 'bi-car-front', '647e84dd-0f93-4cee-ba60-177df95bbe5c'),
        ('Logement', 'Loyer et charges', 'Depense', '#17a2b8', 'bi-house', '647e84dd-0f93-4cee-ba60-177df95bbe5c'),
        ('Loisirs', 'Sorties et divertissement', 'Depense', '#e83e8c', 'bi-controller', '647e84dd-0f93-4cee-ba60-177df95bbe5c');
    
    PRINT 'Catégories créées avec succès !';
END
GO

-- Créer des comptes par défaut pour mohammed
IF NOT EXISTS (SELECT 1 FROM Accounts WHERE UserId = '647e84dd-0f93-4cee-ba60-177df95bbe5c')
BEGIN
    PRINT 'Création des comptes pour mohammed...';
    
    INSERT INTO Accounts (Name, Type, Balance, AccountNumber, Currency, UserId, CreatedAt)
    VALUES 
        ('Compte Courant', 'Courant', 5000.00, '****1234', 'MAD', '647e84dd-0f93-4cee-ba60-177df95bbe5c', GETDATE()),
        ('Compte Épargne', 'Epargne', 10000.00, '****5678', 'MAD', '647e84dd-0f93-4cee-ba60-177df95bbe5c', GETDATE()),
        ('Espèces', 'Especes', 500.00, '0000', 'MAD', '647e84dd-0f93-4cee-ba60-177df95bbe5c', GETDATE());
    
    PRINT 'Comptes créés avec succès !';
END
GO

-- Créer des transactions d'exemple pour mohammed
DECLARE @CategorySalaire INT = (SELECT TOP 1 Id FROM Categories WHERE Name = 'Salaire' AND UserId = '647e84dd-0f93-4cee-ba60-177df95bbe5c');
DECLARE @CategoryAlimentation INT = (SELECT TOP 1 Id FROM Categories WHERE Name = 'Alimentation' AND UserId = '647e84dd-0f93-4cee-ba60-177df95bbe5c');
DECLARE @CategoryTransport INT = (SELECT TOP 1 Id FROM Categories WHERE Name = 'Transport' AND UserId = '647e84dd-0f93-4cee-ba60-177df95bbe5c');
DECLARE @AccountCourant INT = (SELECT TOP 1 Id FROM Accounts WHERE Name = 'Compte Courant' AND UserId = '647e84dd-0f93-4cee-ba60-177df95bbe5c');

IF @CategorySalaire IS NOT NULL AND @AccountCourant IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Transactions WHERE UserId = '647e84dd-0f93-4cee-ba60-177df95bbe5c')
    BEGIN
        PRINT 'Création des transactions pour mohammed...';
        
        INSERT INTO Transactions (Description, Amount, Date, Type, CategoryId, AccountId, UserId, CreatedAt)
        VALUES 
            ('Salaire Décembre', 8000.00, GETDATE(), 'Revenu', @CategorySalaire, @AccountCourant, '647e84dd-0f93-4cee-ba60-177df95bbe5c', GETDATE()),
            ('Courses Marjane', 450.00, GETDATE(), 'Depense', @CategoryAlimentation, @AccountCourant, '647e84dd-0f93-4cee-ba60-177df95bbe5c', GETDATE()),
            ('Essence', 300.00, DATEADD(day, -1, GETDATE()), 'Depense', @CategoryTransport, @AccountCourant, '647e84dd-0f93-4cee-ba60-177df95bbe5c', GETDATE());
        
        PRINT 'Transactions créées avec succès !';
    END
END
GO

PRINT '';
PRINT '========================================';
PRINT 'RÉCAPITULATIF';
PRINT '========================================';
PRINT 'Utilisateur: mohammed@emsi.ma';
PRINT 'Mot de passe: Admin@123';
PRINT 'ID: 647e84dd-0f93-4cee-ba60-177df95bbe5c';
PRINT '========================================';
