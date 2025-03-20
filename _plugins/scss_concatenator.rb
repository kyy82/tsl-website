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
      
      # Only regenerate if source files are newer than the bundle
      # or if the bundle doesn't exist
      need_regeneration = !File.exist?(bundle_file)
      
      if !need_regeneration
        bundle_mtime = File.mtime(bundle_file)
        style_files.each do |file|
          if File.mtime(file) > bundle_mtime
            need_regeneration = true
            break
          end
        end
      end
      
      if need_regeneration
        # Start with no front matter
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
        
        # Only write the main SCSS file if it doesn't exist
        if !File.exist?(main_scss_file)
          main_content = <<~SCSS
          ---
          ---
          
          
          @use "bundle" as *;
          SCSS
          
          File.write(main_scss_file, main_content)
        end
        
        puts "SCSS concatenation complete: _sass/bundle.scss updated with #{style_files.count + (theme_file ? 1 : 0)} files"
      else
        puts "SCSS bundle is up-to-date, skipping regeneration"
      end
    end
  end
end