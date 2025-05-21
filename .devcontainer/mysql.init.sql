-- MySQL initialization for Coder development environment

-- Set root password and allow remote connections
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
SET GLOBAL bind_address = '0.0.0.0';

-- Create databases
CREATE DATABASE IF NOT EXISTS `kibamail`;
CREATE DATABASE IF NOT EXISTS `kibamail-test`;
CREATE DATABASE IF NOT EXISTS `kibamail-test-playwright`;

-- Grant privileges to root user for all databases
GRANT ALL PRIVILEGES ON `kibamail`.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON `kibamail-test`.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON `kibamail-test-playwright`.* TO 'root'@'%';
FLUSH PRIVILEGES;
