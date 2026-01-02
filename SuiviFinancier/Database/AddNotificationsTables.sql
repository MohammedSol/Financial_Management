-- Script SQL pour ajouter les tables Notifications et RecurringPayments
-- Ce script est SAFE : il n'affecte AUCUNE donnée existante
-- Exécuter dans SQL Server Management Studio ou Azure Data Studio

USE SuiviFinancierDb;
GO

-- ============================================
-- 1. Table Notifications
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
BEGIN
    CREATE TABLE [dbo].[Notifications] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [UserId] NVARCHAR(450) NOT NULL,
        [Type] NVARCHAR(50) NOT NULL, -- 'Budget', 'Transaction', 'Payment'
        [Title] NVARCHAR(200) NOT NULL,
        [Message] NVARCHAR(MAX) NOT NULL,
        [Severity] NVARCHAR(20) NOT NULL DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
        [IsRead] BIT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [RelatedEntityId] INT NULL,
        [ActionUrl] NVARCHAR(500) NULL,
        
        -- Foreign Key vers AspNetUsers
        CONSTRAINT [FK_Notifications_AspNetUsers_UserId] 
            FOREIGN KEY ([UserId]) REFERENCES [dbo].[AspNetUsers]([Id]) 
            ON DELETE CASCADE,
        
        -- Index pour améliorer les performances
        INDEX [IX_Notifications_UserId] ([UserId]),
        INDEX [IX_Notifications_CreatedAt] ([CreatedAt] DESC),
        INDEX [IX_Notifications_IsRead] ([IsRead])
    );
    
    PRINT '✅ Table Notifications créée avec succès';
END
ELSE
BEGIN
    PRINT '⚠️ Table Notifications existe déjà';
END
GO

-- ============================================
-- 2. Table RecurringPayments
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RecurringPayments')
BEGIN
    CREATE TABLE [dbo].[RecurringPayments] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [UserId] NVARCHAR(450) NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [Amount] DECIMAL(18, 2) NOT NULL, -- Précision configurée comme demandé
        [DayOfMonth] INT NOT NULL CHECK ([DayOfMonth] >= 1 AND [DayOfMonth] <= 31),
        [CategoryId] INT NULL,
        [AccountId] INT NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [LastNotificationDate] DATETIME2 NULL,
        
        -- Foreign Keys
        CONSTRAINT [FK_RecurringPayments_AspNetUsers_UserId] 
            FOREIGN KEY ([UserId]) REFERENCES [dbo].[AspNetUsers]([Id]) 
            ON DELETE CASCADE,
        
        CONSTRAINT [FK_RecurringPayments_Categories_CategoryId] 
            FOREIGN KEY ([CategoryId]) REFERENCES [dbo].[Categories]([Id]) 
            ON DELETE NO ACTION,
        
        CONSTRAINT [FK_RecurringPayments_Accounts_AccountId] 
            FOREIGN KEY ([AccountId]) REFERENCES [dbo].[Accounts]([Id]) 
            ON DELETE NO ACTION, -- Évite les cycles de cascade
        
        -- Index pour améliorer les performances
        INDEX [IX_RecurringPayments_UserId] ([UserId]),
        INDEX [IX_RecurringPayments_IsActive] ([IsActive]),
        INDEX [IX_RecurringPayments_DayOfMonth] ([DayOfMonth])
    );
    
    PRINT '✅ Table RecurringPayments créée avec succès';
END
ELSE
BEGIN
    PRINT '⚠️ Table RecurringPayments existe déjà';
END
GO

-- ============================================
-- 3. Vérification finale
-- ============================================
PRINT '';
PRINT '=========================================';
PRINT 'VÉRIFICATION DES TABLES';
PRINT '=========================================';

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
    PRINT '✅ Notifications : OK';
ELSE
    PRINT '❌ Notifications : MANQUANTE';

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'RecurringPayments')
    PRINT '✅ RecurringPayments : OK';
ELSE
    PRINT '❌ RecurringPayments : MANQUANTE';

PRINT '=========================================';
PRINT 'Script terminé - Aucune donnée supprimée';
PRINT '=========================================';
GO
