# _plugins/scss_concatenator.rb
module Jekyll
  class SCSSConcatenator < Jekyll::Generator
    safe true
    priority :highest

    def generate(site)
      # Create _sass directory if it doesn't exist
      sass_dir = File.join(site.source, '_sass')
      FileUtils.mkdir_p(sass_dir)
      
      # Path to the bundle file
      bundle_file = File.join(sass_dir, 'bundle.scss')
      
      # Get a list of all SCSS files
      style_files = Dir.glob(File.join(site.source, '_styles', '*.scss')).sort
      
      # Create concatenated content
      concatenated_content = "/* Concatenated SCSS file */\n\n"
      
      # Process -theme.scss first if it exists
      theme_file = style_files.find { |f| File.basename(f) == '-theme.scss' }
      if theme_file
        style_files.delete(theme_file)
        theme_content = File.read(theme_file)
        # Remove YAML front matter if present
        if theme_content.start_with?('---')
          parts = theme_content.split('---', 3)
          theme_content = parts.length >= 3 ? parts[2] : theme_content
        end
        concatenated_content += "/* From -theme.scss */\n#{theme_content.strip}\n\n"
      end
      
      # Append all other files
      style_files.each do |file|
        filename = File.basename(file)
        content = File.read(file)
        
        # Remove YAML front matter if present
        if content.start_with?('---')
          parts = content.split('---', 3)
          content = parts.length >= 3 ? parts[2] : content
        end
        
        concatenated_content += "/* From #{filename} */\n#{content.strip}\n\n"
      end
      
      # Write the concatenated file to _sass
      File.write(bundle_file, concatenated_content)
      
      # Create assets/css directory if it doesn't exist
      assets_css_dir = File.join(site.source, 'assets', 'css')
      FileUtils.mkdir_p(assets_css_dir)
      
      # Path to the main SCSS file
      main_scss_file = File.join(assets_css_dir, 'main.scss')
      
      # Always write the main SCSS file to ensure it's up to date
      main_content = <<~SCSS
      ---
      ---
      

      @use "bundle" as *;
      SCSS
      
      File.write(main_scss_file, main_content)
      
      puts "SCSS concatenation complete: _sass/bundle.scss updated with #{style_files.count + (theme_file ? 1 : 0)} files"
      puts "Main SCSS file written to assets/css/main.scss"
    end
  end
end