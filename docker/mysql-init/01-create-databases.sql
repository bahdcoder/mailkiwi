-- Create additional databases
CREATE DATABASE IF NOT EXISTS `kibamail-test`;
CREATE DATABASE IF NOT EXISTS `kibamail-test-playwright`;

-- Grant privileges to root user for all databases
GRANT ALL PRIVILEGES ON `kibamail`.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON `kibamail-test`.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON `kibamail-test-playwright`.* TO 'root'@'%';
FLUSH PRIVILEGES;
